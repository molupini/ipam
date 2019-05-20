// modules
const express = require("express")
const router = new express.Router()
const auth = require('../middleware/auth')
const Address = require("../model/address")
const { doPingCheck } = require("../src/util/check")

// endpoint
// CRUD
// TODO not required if populate via network router by users but will be necessary for services to update avaiablity
// GET {{url}}/addresses?network=192.168&available=true&owner=null&limit=5&skip=0&sort=updatedAt:acs

router.get("/addresses", auth, async (req, res) => {
    try {
        const match = {}
        const options = {}
        const sort = {}
        if (req.query.network) {
            if (!req.query.network.match(/^[0-9]{1,3}(\.[0-9]{1,3}|\.){0,3}$/)) {
                return res.status(400).send({
                    error: 'Please provide a valid network'
                })
            }
            match.address = new RegExp(`^${req.query.network}`)
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
router.patch("/addresses/:id", auth, async (req, res) => {
    try {
        const match = {}
        const address = await Address.findById(req.params.id)
        if (!address) {
            return res.status(404).send({
                error: "Not Found"
            })
        }

        if (req.query.available) {
            match.isAvailable = req.query.available === 'true'
            address.isAvailable = match.isAvailable
            if (match.isAvailable) {
                address.trueCount++
            }
            if (!match.isAvailable) {
                address.falseCount++
            }
            address.count++
        }

        if (req.query.owner === address.owner.toString()) {
            // console.log(address)
            address.owner = null
        }

        await address.save()
        res.status(200).send(address)
    } catch (e) {
        res.status(500).send(e)
    }
})

// get, user check-out address with hard-coded options and -- populate network to be provided
router.get('/addresses/checkout', auth, async (req, res) => {
    try {
        const match = {}
        const options = {}

        match.isAvailable = true
        match.owner = null
        options.limit = 5
        options.sort = {
            'updatedAt': -1
        }

        // console.log({match, options})

        if (req.query.network) {
            if (!req.query.network.match(/^[0-9]{1,3}(\.[0-9]{1,3}|\.){1,2}\.0$/)) {
                return res.status(400).send({
                    error: 'Please provide a valid network'
                })
            }
            match.address = new RegExp(`^${req.query.network.replace(/0$/,'')}`)
        }
        else if (req.query.author) {
           match.author = req.query.author
        }
        else { 
            return res.status(400).send({
                error: 'Please provide a valid networkAddress or author'
            })
        }

        const address = await Address.find(match, null, options)

        if (!address || address.length === 0) {
            return res.status(404).send()
        }

        // console.log(address)
        
        const pingLoop = async () => {
            let array = []
            for (i = 0; i < address.length; i++) {
                // const result = await address[i]
                // console.log(`${address[i].id}, ${address[i].address}, ping`)
                await doPingCheck(address[i].address).then((result) => {
                    if (!result) {
                        result = address[i].id
                        array.push(result)
                        i = address.length
                    }
                })
                
            }
            // console.log(array)
            return array
        }

        const test = await pingLoop()
        // console.log(test[0])

        const update = await Address.findById(test[0])
        if (update) {
            update.isAvailable = false
            update.owner = req.user.id
        }

        await update.save()

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