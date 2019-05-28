const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
// const Port = require('../model/port')
const Address = require('../model/address')


// user only, via email confirmation 
router.get('/configs/suggest', async (req,res) => {
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
        if(req.query.port){
            address.portNumber = req.query.port
        }
        await address.save()
        res.status(200).send(address)
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

// used by scanner & userAdmin
router.get('/configs/ports', auth, async (req,res) => {
    try {
        const address = await Address.find().distinct('portNumber')
        if(!address){
            return res.status(404).send({
                error: "Not Found"
            })    
        }        
        res.status(200).send(address)
    } catch (e) {
        res.status(500).send(e)
    }
})


module.exports = router