// modules
const express = require("express")
const router = new express.Router()
const auth = require("../middleware/auth")
const Network = require("../model/network")
const valid = require("../src/util/compare")
const message = require('../email/message')

// endpoints 
// CRUD operations below
// create network
router.post('/networks', auth, async (req, res) => {
    try {
        // const network = new Network(req.body)
        const network = new Network({
            ...req.body,
            author: req.user._id
        })
        await network.save()
        message.networkConfirm(req.user.emailAddress, network._id, network.networkAddress)
        res.status(201).send(network)
    } catch (e) {
        res.status(500).send(e)
    }
})

// get, confirm network and build addresses
router.get("/networks/:id/confirm", auth, async (req, res) => {
    try {
        const _id = req.params.id
        const network = await Network.findById(_id)
        if (!network) {
            return res.status(404).send({message:'Not Found'})
        }
        if (network.networkConfirmed) {
            return res.status(406).send({message:"Network confirmed"})
        }
        network.networkConfirmed = true
        network.save()
        res.status(202).send()
    } catch (e) {
        res.status(500).send(e)
    }
})

// get, all 
router.get("/networks", auth, async (req, res) => {
    try {
        const network = await Network.find({})
        if (!network) {
            return res.status(404).send({message:'Not Found'})
        }
        res.status(200).send(network)
    } catch (e) {
        res.status(500).send(e)
    }
})

// get, id 
router.get("/networks/:id", auth, async (req, res) => {
    const _id = req.params.id
    try {
        const network = await Network.findById({ _id })
        if (!network) {
            return res.status(404).send({message:'Not Found'})
        }
        await network.updateNumHosts(network._id)
        if (req.query.populate === 'true') {
            await network.populate({
                path: 'address'
            }).execPopulate()
        }
        res.status(200).send({
            network, 
            addresses: network.address}
        )
    } catch (e) {
        res.status(500).send(e)
    }
})

// patch network, with validation and key exclusion
// findByIdAndUpdate() will bypass the middleware which is what we require when posting the changes below
router.patch("/networks/:id", auth, async (req, res) => {
    // "networkConfirmed", excluded 
    const exclude = ["networkAddress", "subnetMask", "numHosts", "subnetMaskLength", "broadcastAddress", "lastAddress", "firstAddress"]
    const isValid = valid(req.body, Network.schema.obj, exclude)
    if (!isValid) {
        return res.status(400).send({message:"Please provide a valid input"})
    }
    try {
        const network = await Network.findById(req.params.id)
        if (!network) {
            return res.status(404).send({message:'Not Found'})
        }
        if (network.author !== null && network.author.toString() !== req.user.id.toString()) {
            return res.status(403).send({message:"Forbidden"})
        }
        const body = Object.keys(req.body)
        body.forEach(value => {
            network[value] = req.body[value]
        })
        await network.save()
        res.status(201).send(network)
    } catch (e) {
        res.status(500).send({
            error: e.message
        })
    }
})

// delete network 
router.delete("/networks/:id", auth, async (req, res) => {
    try {
        const network = await Network.findById(req.params.id)
        if (!network) {
            return res.status(404).send({message:'Not Found'})
        }
        if (network.author.toString() !== req.user.id.toString()) {
            return res.status(403).send({message:"Forbidden"})
        }
        await network.remove()
        res.status(200).send()
    } catch (e) {
        res.status(500).send()
    }
})

// exports 
module.exports = router