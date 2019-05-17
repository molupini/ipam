// user router
// authenication required for operating IPAM solution
// Basic CRUD operation 
const express = require("express")
const User = require("../model/user")
const auth = require("../middleware/auth")
const router = new express.Router()
const valid = require("../src/util/compare")
const message = require('../email/message')
const random = require('randomatic')

// create user
router.post("/users/create", async (req, res) => {
    try {
        const user = await new User(req.body)
        await user.save()
        res.status(201).send(user)
        
    } catch (e) {
        res.status(500).send(e)
    }
})

// get, confirm user
// TODO - send JWT
// endpoint used to retrieve your credentials
// query string, for jwt extension
router.get("/users/:id/confirm", async (req, res) => {
    try {
        const _id = req.params.id
        const user = await User.findByIdAndUpdate(_id, {
            userConfirmed: true
        })
        if (!user) {
            return res.status(404).send({error: "User Not Found"})
        }
        // already confirmed
        if(user.userConfirmed === true){
            return res.status(400).send({error:'userConfirmed'})
        }
        if(req.query.userMoified === 'true'){
            return res.status(200).send()
        }
        
        var days = 0
        if(req.query.extendToken){
            days = 365
        }else{
            days = 60
        }

        const token = await user.generateAuthToken(days)
        res.status(202).send({user, token})
    } catch (e) {
        res.status(500).send(e)
    }
})

// post, login
// TODO - send JWT
// endpoint used to retrieve your credentials
router.patch("/users/login", async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.emailAddress, req.body.password)
        const token = await user.generateAuthToken(60)
        res.status(200).send({user, token})
    } catch (e) {
        res.status(500).send({
            error: e.message
        })
    }    
})

// post, reset
// TODO - prevent multi resets
router.get("/users/:id/reset", async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(404).send({error: "User Not Found"})
        }
        
        // already reset
        // if(user.loginFailure === 0){
        //     return res.status(400).send()
        // }
        
        const pass = random('Aa0', 12)
        user.userConfirmed = true
        user.loginFailure = 0
        user.password = pass

        await user.save()
        res.status(200).send({user, pass})
    } catch (e) {
        res.status(500).send({
            error: e.message
        })
    }    
})

// logout, current session
router.post("/users/logout", auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.status(200).send()
    } catch (e) {
        res.status(500).send({
            error: e.message
        })
    }
})

// logout, all sessions
// helpful when more then one device or a shared account
router.post("/users/logoutall", auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.status(200).send()
    } catch (e) {
        res.status(500).send({
            error: e.message
        })
    }
})

// get, me
router.get("/users/me", auth, (req, res) => {
    res.status(200).send(req.user)
})

// get, my networks
router.get("/users/my/networks", auth, async(req, res) => {
    try {
        const user = await User.findById(req.user.id)
        await user.populate('network').execPopulate()
        res.status(200).send(user.network)
    } catch (e) {
        res.status(500).send(e)
    }
})

// get, my addresses
router.get("/users/my/addresses", auth, async (req, res) => {
    try {
        const options = {}
        options.sort = {
            'updatedAt': -1
        }
        const user = await User.findById(req.user.id)
        await user.populate({ path:'address', options }).execPopulate()
        res.status(200).send(user.address)
    } catch (e) {
        res.status(500).send(e)
    }
})

// patch, me
router.patch("/users/me", auth, async (req, res) => {
    const isValid = valid(req.body, User.schema.obj)
    if (!isValid) {
        return res.status(400).send({
            error: "Please provide valid data"
        })
    }
    try {
        const body = Object.keys(req.body)
        body.forEach(value => {
            req.user[value] = req.body[value]
        })
        await req.user.save()
        res.status(200).send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})

// delete, me
router.delete("/users/me", auth, async (req, res) => {
    try {
        await req.user.remove()
        res.status(200).send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

// exports
module.exports = router