// modules
const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
const Address = require('../model/address')
const { FalsePositive } = require('../src/util/counter')
const { doPingCheck } = require('../src/util/check')
const { logger } = require('../src/util/log')
const valid = require('../src/util/compare')

// CRUD
// get addresses, query strings optional 
// example {{url}}/addresses?network=192.168&available=true&owner=null&limit=5&skip=0&sort=updatedAt:acs
router.get('/addresses', auth, async (req, res) => {
    try {
        const match = {}
        const options = {}
        const sort = {}
        if (req.query.network) {
            if (!req.query.network.match(/^[0-9]{1,3}(\.[0-9]{1,3}|\.){1,2}\.0$/)) {
                return res.status(400).send({message:'Please provide a valid network'})
            }
            match.address = new RegExp(`^${req.query.network.replace(/0$/,'')}`)
        }
        if (req.query.available) {
            match.isAvailable = req.query.available === 'true'
        }
        if (req.query.owner === 'null') {
            match.owner = null
        }
        if (!req.query.cloudHosted === 'true') {
            match.cloudHosted = true
        }else {
            match.cloudHosted = false
        }
        if (req.query.limit) { 
            options.limit = parseInt(req.query.limit)
        }else{
            options.limit = parseInt(req.user.maxCount)
        }
        if (req.query.skip) {
            options.skip = parseInt(req.query.skip)
        }
        if (req.query.sort) {
            const parts = req.query.sort.split(':')
            sort[parts[0]] = parts[1] === 'desc' ? -1 : 1 
            options.sort = sort
        }
        const address = await Address.find(match, null, options)
        if (!address || address.length <= 0) {
            return res.status(404).send({message:'Not Found'})
        }
        res.status(200).send(address)
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

// used by scanner 
router.get('/addresses/init', auth, async (req, res) => {
    try {
        const options = {}
        const sort = {}
        if(req.query.count === 'true'){
            const count = await Address.countDocuments({
                isInitialized: false, 
                gatewayAvailable: true,
                cloudHosted: false
            })
            return res.status(200).send({message:count})
        }
        if (req.query.limit) { 
            options.limit = parseInt(req.query.limit)
        }else{
            options.limit = parseInt(req.user.maxCount)
        }
        if (req.query.skip) {
            options.skip = parseInt(req.query.skip)
        }
        if (req.query.sort) {
            const parts = req.query.sort.split(':')
            sort[parts[0]] = parts[1] === 'desc' ? -1 : 1 
            options.sort = sort
        }
        const address = await Address.find({
            isInitialized: false, 
            gatewayAvailable: true,
            cloudHosted: false
        }, null, options)

        if(!address){
            return res.status(204).send({message:'No Content'})
        }
        address.forEach(addr => {
            addr.isInitialized = true
            addr.save()
        })
        res.status(201).send(address)
    }catch(e){
        res.status(500).send({error: e.message})
    }
})

// used by scanner 
router.patch('/addresses/network/:id/gateway', auth, async (req, res) => {
    try {
        const address = await Address.find({
            author: req.params.id
        })
        if(!address){
            return res.status(404).send({message:'Not Found'})
        }
        if(req.query.available){
            if(req.query.available === 'true'){
                await Address.updateMany({
                    author: req.params.id
                },{
                    gatewayAvailable: true
                })
            }
            else {
                await Address.updateMany({
                    author: req.params.id
                },{
                    gatewayAvailable: false,
                    isAvailable: false
                })
            }
        }
        return res.status(201).send({message: `Gateway available, ${req.query.available}`})
    }catch(e){
        res.status(500).send({error: e.message})
    }
})

// patch address by id, available=true or false, check-in / check-out address
// used by scanner to patch specific attributes within query string. 
// No req.body parameters will be parsed
router.patch('/addresses/status/:id', auth, async (req, res) => {
    try {
        const match = {}
        const address = await Address.findById(req.params.id)
        if (!address) {
            return res.status(404).send({message:'Not Found'})
        }
        // used by scanner 
        if (req.query.available) {
            match.isAvailable = req.query.available === 'true'
            address.isAvailable = match.isAvailable
            // is available, true - update true count
            if (match.isAvailable) {
                address.trueCount++
                // verify if FalsePositive 
                const isFalsePositive = await FalsePositive(address, req.query.maxFp)
                if (isFalsePositive){
                    address.owner = null 
                }
            }
            // is available, false - update false count
            if (!match.isAvailable) {
                address.falseCount++
                if (address.owner != null && address.falseCount > 0){
                }
            }
            // scanned 
            address.count++
        }
        // used by admin user to transfer ownership manually from specific id to null
        if (req.query.owner && address.owner !== null) {
            if(req.query.owner === address.owner.toString()) {
                address.owner = null
            }
        }
        // primary port number
        if (req.query.port){
            address.portNumber = req.query.port
        }
        // fully qualified domain name
        if (req.query.fqdn){
            update.fqdn = req.query.fqdn
        }
        await address.save()
        res.status(200).send(address)
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

router.patch('/addresses/:id', auth, async (req, res) => {
    const exclude = ['isInitialized','isAvailable','gatewayAvailable', 'count', 'falseCount', 'trueCount', 'firstAddress', '_id', 'address', 'author']
    const isValid = valid(req.body, Address.schema.obj, exclude)
    if (!isValid) {
        return res.status(400).send({message:'Please provide a valid input'})
    }
    try {
        const address = await Address.findById(req.params.id)
        if (!address) {
            return res.status(404).send({message:'Not Found'})
        }
        if(!req.user.userRoot){
            if (address.owner !== null && address.owner.toString() !== req.user.id.toString()) {
                return res.status(403).send({message:'Forbidden'})
            }
        }
        const body = Object.keys(req.body)
        body.forEach(value => {
            address[value] = req.body[value]
        })
        await address.save()
        res.status(201).send(address)
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

// get, user check-out address with hard-coded options, populate network in query string 
router.get('/addresses/checkout', auth, async (req, res) => {
    try {
        const match = {}
        const options = {}
        // hard-coded options, only available address that have no owner allocated,
        // limit amount provided by env variable
        match.isAvailable = true
        match.gatewayAvailable = true
        match.owner = null
        options.limit = parseInt(req.user.maxCount)
        options.sort = {
            'updatedAt': -1
        }
        // two possible options
        // query by network 
        if (req.query.network) {
            if (!req.query.network.match(/^[0-9]{1,3}(\.[0-9]{1,3}|\.){1,2}\.0$/)) {
                return res.status(400).send({message:'Please provide a valid network'})
            }
            match.address = new RegExp(`^${req.query.network.replace(/0$/,'')}`)
        }
        // query by author
        else if (req.query.author) {
            match.author = req.query.author
        }
        else { 
            return res.status(400).send({message:'Please provide a valid network address or author'})
        }
        if (!req.query.cloudHosted === 'true') {
            match.cloudHosted = true
        }else {
            match.cloudHosted = false
        }
        var address = null
        try {
            address = await Address.find(match, null, options)    
        } catch (e) {
            logger.log('info', 'Network address limit reached, check scope')
            // changing limit to 1 if address range is less then limit
            options.limit = 1
            address = await Address.find(match, null, options)
        }
        // 404 if null or array length zero
        if (!address || address.length === 0) {
            return res.status(404).send({message:'Not Found'})
        }
        // ping/array of addresses function 
        const pingLoop = async () => {
            let array = []
            for (i = 0; i < address.length; i++) {
                await doPingCheck(address[i].address).then((result) => {
                    if (!result) {
                        result = address[i].id
                        array.push(result)
                        i = address.length
                    }
                })
            }
            return array
        }
        // awaiting ping
        const test = await pingLoop()
        const update = await Address.findById(test[0])
        if (update) {
            update.isAvailable = false
            update.owner = req.user.id
            // primary port number
            if (req.query.port){
                update.portNumber = req.query.port
            }
            if (req.query.fqdn){
                update.fqdn = req.query.fqdn
            }
        }
        await update.save()
        // create a virtual between local _id and author aka network 
        if (req.query.populate === 'true') {
            await update.populate({
                path: 'network'
            }).execPopulate()
        }
        res.status(200).send({
            addresses: update,
            network: update.network
        })
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

// export
module.exports = router