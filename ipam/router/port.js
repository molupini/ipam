const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
const Port = require('../model/port')
const Address = require('../model/address')


// userConfirmed and userAdmin function
router.post('/configs/ports', auth, async (req,res) => {
    try {
        const port = await new Port(req.body)
        await port.save()
        res.status(201).send(port)
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

// user only, via email confirmation 
router.get('/configs/ports/suggest', async (req,res) => {
    try {
        // mandatory fields
        if(!req.query.conf){
            return res.status(400).send({
                error: "Missing element in query string"
            })
        }
        // splitting string
        const userId = req.query.conf.split(':')[0]
        const count = req.query.conf.split(':')[1]
        const addressId = req.query.conf.split(':')[2]

        // address lookup
        const address = await Address.findById(addressId)
        if(!address){
            return res.status(404).send({
                error: "Not Found"
            })    
        }
        // compare fields
        // debugging
        // console.log({userId, count, addressId});
        if(userId !== address.owner.toString() || addressId !== address.id.toString() || parseInt(count) !== address.count){
            return res.status(400).send({
                error: "Bad Request"
            })      
        }
        // create document and verify within save method if author exists 
        const ports = await new Port({
            author: addressId,
            portNumber: req.query.port
        })
        await ports.save()
        res.status(200).send(ports)
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

// used by scanner & userAdmin
router.get('/configs/ports', auth, async (req,res) => {
    try {
        var ports = false
        // query string for finding unique port number suggestions
        if(req.query.unique === 'true'){
            ports = await Port.find().distinct('portNumber')
        }else{
            ports = await Port.find()
        }
        if(!ports){
            res.status(404).send({
                error: "Not Found"
            })    
        }        
        res.status(200).send(ports)
    } catch (e) {
        res.status(500).send()
    }
})


module.exports = router