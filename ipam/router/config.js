const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
// const Port = require('../model/port')
const Address = require('../model/address')
const Schedule = require('../model/schedule')
const Messenger = require('../model/messenger')
const valid = require('../src/util/compare')


// PORT CONFIG
// user only, via email confirmation 
router.get('/configs/suggest', async (req,res) => {
    try {
        // mandatory fields
        if(!req.query.conf){
            return res.status(400).send({message:'Missing element in query string'})
        }
        // splitting string
        const userId = req.query.conf.split(':')[0]
        const count = req.query.conf.split(':')[1]
        const addressId = req.query.conf.split(':')[2]

        // address lookup
        const address = await Address.findById(addressId)
        if(!address){
            return res.status(404).send({message:'Not Found'})    
        }
        // compare fields
        if(userId !== address.owner.toString() || addressId !== address.id.toString() || parseInt(count) !== address.count){
            return res.status(400).send({message:'Bad Request'})      
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

// userAdmin verify distinct ports
router.get('/configs/ports', auth, async (req,res) => {
    try {
        const address = await Address.find().distinct('portNumber')
        if(!address){
            return res.status(404).send({message:'Not Found'})    
        }        
        res.status(200).send(address)
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})


// SCHEDULE CONFIG
// used by scanner
router.get('/configs/schedules', auth, async (req,res) => {
    try {
        var options = {}
        if (req.query.limit) { 
            options.limit = parseInt(req.query.limit)
        }else{
            options.limit = parseInt(req.user.maxAmount)
        }
        if (req.query.skip) {
            options.skip = parseInt(req.query.skip)
        }
        const match = {}
        var schedule = null
        if(req.query.endpoint){
            match.endpoint = req.query.endpoint
            schedule = await Schedule.findOne({
                endpoint: match.endpoint
            })
        }else{
            schedule = await Schedule.find({}, null, options)
        }
        if(!schedule){
            return res.status(404).send({message:'Not Found'})    
        }        

        res.status(200).send(schedule)
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

// used by admins
router.post('/configs/schedules', auth, async (req,res) => {
    try {
        const schedule = await new Schedule({
            author: req.user,
            ...req.body
        })
        if(!schedule){
            return res.status(404).send({message:'Not Found'})    
        }        
        await schedule.save()
        res.status(200).send(schedule)
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

// patch, with validation and key exclusion
// parse body for allowed fields 
router.patch('/configs/schedules/:id', auth, async (req, res) => {
    const exclude = ['eventFired']
    const isValid = valid(req.body, Schedule.schema.obj, exclude)
    if (!isValid) {
        return res.status(400).send({message:'Please provide a valid input'})
    }
    try {
        const schedule = await Schedule.findById(req.params.id)
        if (!schedule) {
            return res.status(404).send({message:'Not Found'})
        }
        if(!req.user.userRoot){
            if (schedule.author.toString() !== req.user.id.toString()) {
                return res.status(403).send({message:'Forbidden'})
            }
        }
        const body = Object.keys(req.body)
        body.forEach(value => {
            schedule[value] = req.body[value]
        })
        await schedule.save()
        res.status(201).send(schedule)
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

// patch, event scanner only
// No req.body parameters will be parsed
router.patch('/configs/schedules/event/:id', auth, async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id)
        if (!schedule) {
            return res.status(404).send({message:'Not Found'})
        }
        if(!req.user.userRoot){
            if (schedule.author.toString() !== req.user.id.toString()) {
                return res.status(403).send({message:'Forbidden'})
            }
        }
        schedule.eventFired = req.query.event === 'true'
        await Address.updateMany({
            isInitialized: true
        }
        ,{
            isInitialized: false
        })
        await schedule.save()
        res.status(201).send(schedule)
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})


// MESSENGER CONFIG
router.get('/configs/messengers', auth, async (req,res) => {
    try {
        var options = {}
        if (req.query.limit) { 
            options.limit = parseInt(req.query.limit)
        }else{
            options.limit = parseInt(req.user.maxAmount)
        }
        if (req.query.skip) {
            options.skip = parseInt(req.query.skip)
        }
        const match = {}
        var messenger = null
        if(req.query.provider){
            match.provider = req.query.provider
            messenger = await Messenger.findOne({
                provider: match.provider
            })
        }else{
            messenger = await Messenger.find({}, null, options)
        }
        if(!messenger){
            return res.status(404).send({message:'Not Found'})    
        }        

        res.status(200).send(messenger)
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

// used by admins
router.post('/configs/messengers', auth, async (req,res) => {
    try {
        const messenger = await new Messenger({
            author: req.user,
            ...req.body
        })
        if(!messenger){
            return res.status(404).send({message:'Not Found'})    
        }        
        await messenger.save()
        res.status(200).send(messenger)
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

// patch, with validation and key exclusion
// parse body for allowed fields 
router.patch('/configs/messengers/:id', auth, async (req, res) => {
    const exclude = ['provider']
    const isValid = valid(req.body, Messenger.schema.obj, exclude)
    if (!isValid) {
        return res.status(400).send({message:'Please provide a valid input'})
    }
    try {
        const messenger = await Messenger.findById(req.params.id)
        if (!messenger) {
            return res.status(404).send({message:'Not Found'})
        }
        if(!req.user.userRoot){
            if (messenger.author.toString() !== req.user.id.toString()) {
                return res.status(403).send({message:'Forbidden'})
            }
        }
        const body = Object.keys(req.body)
        body.forEach(value => {
            messenger[value] = req.body[value]
        })
        await messenger.save()
        res.status(201).send(messenger)
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})


module.exports = router