const express = require('express')
const User = require('../model/user')
const auth = require('../middleware/auth')
const router = new express.Router()
const valid = require("../src/util/compare")

// TODO auth required
// TODO for admins only - first create account/root

router.post('/admin/create', async (req, res) => {
    try {
        
    } catch (e) {
        
    }
})

// get, all users
router.get('/admin/users', async (req, res) => {
    try {
        const user = await User.find({})
        res.status(200).send(user)
    } catch (e) {
        res.status(500).send(e)
    }
})

// get, id
router.get('/admin/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) {
           return res.status(404).send()
        }
        res.status(200).send(user)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.patch("/admin/users/:id", async (req, res) => {
    const isValid = valid(req.body, User.schema.obj)
    if (!isValid) {
       return res.status(400).send({error: "Please provide a valid input"})
    }
    try {
        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(404).send()
        }
        const body = Object.keys(req.body)
        body.forEach(value => {
            user[value] = req.body[value]
        })
        await user.save()
        res.status(200).send(user)
    } catch (e) {
        res.status(500).send(e)
    }    
})

router.delete('/admin/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id)
        if(!user){
            return res.status(404).send({error: "User Not Found"})
        }
        await res.status(200).send(user)
    } catch (e) {
        await res.status(500).send()
    }
})

module.exports = router 