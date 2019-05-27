// modules
const express = require("express")
const router = new express.Router()
const auth = require('../middleware/auth')
const Address = require("../model/address")
const { FalsePositive } = require('../src/util/counter')
const { doPingCheck } = require("../src/util/check")

// CRUD
// get addresses, query strings optional 
// example {{url}}/addresses?network=192.168&available=true&owner=null&limit=5&skip=0&sort=updatedAt:acs
router.get("/addresses", auth, async (req, res) => {
    try {
        const match = {}
        const options = {}
        const sort = {}
        if (req.query.network) {
            if (!req.query.network.match(/^[0-9]{1,3}(\.[0-9]{1,3}|\.){1,2}\.0$/)) {
                return res.status(400).send({
                    error: 'Please provide a valid network'
                })
            }
            match.address = new RegExp(`^${req.query.network.replace(/0$/,'')}`)
        }
        if (req.query.available) {
            match.isAvailable = req.query.available === 'true'
        }
        if (req.query.owner === 'null') {
            match.owner = null
        }
        if (req.query.limit) { 
            options.limit = parseInt(req.query.limit)
        }
        if (req.query.skip) {
            options.skip = parseInt(req.query.skip)
        }
        if (req.query.sort) {
            const parts = req.query.sort.split(':')
            sort[parts[0]] = parts[1] === 'desc' ? -1 : 1 
            options.sort = sort
        }
        // console.log({match, options})
        const address = await Address.find(match, null, options)
        if (!address) {
            res.status(404).send()
        }
        
        res.status(200).send(address)
    } catch (e) {
        res.status(500).send(e)
    }
})

// patch address by id, available=true or false, check-in / check-out address
// used by scanner to patch specific attributes within query string 
router.patch("/addresses/:id", auth, async (req, res) => {
    try {
        const match = {}
        const address = await Address.findById(req.params.id)
        if (!address) {
            return res.status(404).send({
                error: "Not Found"
            })
        }
        // used by scanner 
        // debugging
        if (req.query.available) {
            match.isAvailable = req.query.available === 'true'
            address.isAvailable = match.isAvailable
            // is available, true - update true count
            if (match.isAvailable) {
                address.trueCount++
                // verify if FalsePositive 
                const isFalsePositive = await FalsePositive(address)
                
                if (isFalsePositive){
                    // debugging 
                    console.log('isFalsePositive :', isFalsePositive);
                    address.owner = null 
                }
            }
            // is available, false - update false count
            if (!match.isAvailable) {
                address.falseCount++
                if (address.owner != null && address.falseCount > 0){
                    // debugging 
                    // console.log({info: `Address ${address.address} status, ${address.isAvailable}`})
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

        // debugging 
        // console.log(address)
        await address.save()
        res.status(200).send(address)
    } catch (e) {
        res.status(500).send(e)
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
        match.owner = null
        options.limit = parseInt(process.env.MAX_QUERY_LIMIT)
        options.sort = {
            'updatedAt': -1
        }
        // two possible options
        // query by network 
        if (req.query.network) {
            if (!req.query.network.match(/^[0-9]{1,3}(\.[0-9]{1,3}|\.){1,2}\.0$/)) {
                return res.status(400).send({
                    error: 'Please provide a valid network'
                })
            }
            match.address = new RegExp(`^${req.query.network.replace(/0$/,'')}`)
        }
        // query by author
        else if (req.query.author) {
            match.author = req.query.author
        }
        else { 
            return res.status(400).send({
                error: 'Please provide a valid network address or author'
            })
        }
        // find based on match
        // debugging 
        // console.log({match, options})
        var address = null
        try {
            address = await Address.find(match, null, options)    
        } catch (e) {
            // TODO - email owner of network
            console.log({warning: 'Network address limit reached, check scope'})
            options.limit = 1
            address = await Address.find(match, null, options)
        }
        // 404 if null or array length zero
        if (!address || address.length === 0) {
            return res.status(404).send()
        }
        // ping/array of addresses function 
        const pingLoop = async () => {
            let array = []
            for (i = 0; i < address.length; i++) {
                // debugging
                // const result = await address[i]
                // console.log(`${address[i].id}, ${address[i].address}, ping`)
                await doPingCheck(address[i].address).then((result) => {
                    // 
                    if (!result) {
                        result = address[i].id
                        array.push(result)
                        i = address.length
                    }
                })
            }
            // debugging
            // console.log(array)
            return array
        }
        // awaiting ping
        const test = await pingLoop()
        // console.log(test[0])
        const update = await Address.findById(test[0])
        if (update) {
            update.isAvailable = false
            update.owner = req.user.id
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
        res.status(500).send(e)
    }
})

// export
module.exports = router