const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
// const Port = require('../model/port')
const Address = require('../model/address')
const Schedule = require('../model/schedule')
const valid = require('../src/util/compare')

// user only, via email confirmation 
router.get('/configs/suggest', async (req,res) => {
    try {
        // mandatory fields
        if(!req.query.conf){
            return res.status(400).send({message:"Missing element in query string"})
        }
        // splitting string
        const userId = req.query.conf.split(':')[0]
        const count = req.query.conf.split(':')[1]
        const addressId = req.query.conf.split(':')[2]

        // address lookup
        const address = await Address.findById(addressId)
        if(!address){
            return res.status(404).send({message:"Not Found"})    
        }
        // compare fields
        // debugging
        // console.log({userId, count, addressId});
        if(userId !== address.owner.toString() || addressId !== address.id.toString() || parseInt(count) !== address.count){
            return res.status(400).send({message:"Bad Request"})      
        }
        if(req.query.port){
            address.portNumber = req.query.port
        }
        await address.save()
        res.status(200).send(address)
    } catch (e) {
        res.status(500).send(e)
    }
})

// used by scanner & userAdmin
router.get('/configs/ports', auth, async (req,res) => {
    try {
        const address = await Address.find().distinct('portNumber')
        if(!address){
            return res.status(404).send({message:"Not Found"})    
        }        
        res.status(200).send(address)
    } catch (e) {
        res.status(500).send(e)
    }
})

// used by scanner & userAdmin
router.get('/configs/schedules', auth, async (req,res) => {
    try {
        const match = {}
        var schedule = null
        if(req.query.endpoint){
            match.endpoint = req.query.endpoint
            schedule = await Schedule.findOne({
                endpoint: match.endpoint
            })
        }else{
            schedule = await Schedule.find({})
        }
        if(!schedule){
            return res.status(404).send({message:"Not Found"})    
        }        

        res.status(200).send(schedule)
    } catch (e) {
        res.status(500).send(e)
    }
})

// used by admins
router.post('/configs/schedules', auth, async (req,res) => {
    try {
        // debugging
        // console.log('req.user :', req.user)
        const schedule = await new Schedule({
            author: req.user,
            ...req.body
        })
        if(!schedule){
            return res.status(404).send({message:"Not Found"})    
        }        
        await schedule.save()
        res.status(200).send(schedule)
    } catch (e) {
        res.status(500).send(e)
    }
})

// patch, with validation and key exclusion
router.patch("/configs/schedules/:id", auth, async (req, res) => {
    const exclude = ["author", "eventFired"]
    const isValid = valid(req.body, Schedule.schema.obj, exclude)
    if (!isValid) {
        return res.status(400).send({message:"Please provide a valid input"})
    }
    try {
        const schedule = await Schedule.findById(req.params.id)
        // debugging
        // console.log(schedule)
        if (!schedule) {
            return res.status(404).send({message:"Not Found"})
        }
        if (schedule.author.toString() !== req.user.id.toString()) {
            return res.status(403).send({message:"Forbidden"})
        }
        const body = Object.keys(req.body)
        body.forEach(value => {
            schedule[value] = req.body[value]
        })
        // debugging
        // console.log(body,schedule)
        await schedule.save()
        res.status(201).send(schedule)
    } catch (e) {
        res.status(500).send(e)
    }
})

// patch, event scanner only
router.patch("/configs/schedules/event/:id", auth, async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id)
        // debugging
        // console.log(schedule, req.query.event)
        if (!schedule) {
            return res.status(404).send({message:"Not Found"})
        }
        if (schedule.author.toString() !== req.user.id.toString()) {
            return res.status(403).send({message:"Forbidden"})
        }
        schedule.eventFired = req.query.event === 'true'
        await schedule.save()
        res.status(201).send(schedule)
    } catch (e) {
        res.status(500).send(e)
    }
})

// patch, progress scanner only
// router.patch("/configs/schedules/progress/:id", auth, async (req, res) => {
//     try {
//         const schedule = await Schedule.findById(req.params.id)
//         // debugging
//         // console.log(schedule, req.query)
//         if (!schedule) {
//             return res.status(404).send({message:"Not Found"})
//         }
//         if (schedule.author.toString() !== req.user.id.toString()) {
//             return res.status(403).send({message:"Forbidden"})
//         }
//         if(req.query.lock){
//             schedule.scanInProgress = req.query.lock === 'true'
//         }
//         if(req.query.interval){
//             if(schedule.minuteInterval === parseInt(req.query.interval)){
//                 var n = parseInt(req.query.interval)
//                 n+=1
//                 schedule.minuteInterval = n
//             }
//         }
//         await schedule.save()
//         res.status(201).send(schedule)
//     } catch (e) {
//         res.status(500).send(e)
//     }
// })


module.exports = router