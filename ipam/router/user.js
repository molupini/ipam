// user router
// authentication required for operating IP Address Manager solution
// Basic CRUD operation 
const express = require("express")
const User = require("../model/user")
const auth = require("../middleware/auth")
const router = new express.Router()
const valid = require("../src/util/compare")
const random = require('randomatic')
const message = require('../email/message')

// create user
router.post("/users/create", async (req, res) => {
    try {
        const user = await new User(req.body)
        // user creation count, userRoot, userAdmin role assigned to count 'n' 0
        const num = await User.countDocuments()
        user.n = num
        await user.save()
        // if successful save confirmation email will be sent
        await message.userCreated(user.emailAddress, user.id)
        res.status(201).send(user)
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

// get, confirm user
// TODO - send JWT via email
// 1 endpoint used to retrieve your credentials
router.get("/users/:id/confirm", async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(404).send({error: "User Not Found"})
        }
        // already confirmed
        if(user.userConfirmed === true){
            return res.status(400).send({error:'User confirmed'})
        }
        // confirm user account 
        user.userConfirmed = true
        // user account modified by user reset endpoint
        if(req.query.userModified === 'true') {
            user.save()
            // return res.redirect('/users/login')
            return res.status(200).send()
        }
        // query string, for jwt extension, will not allow greater then 365, default 2 days
        var days = 2
        if(req.query.extendToken && typeof parseInt(req.query.extendToken) === 'number'){
            if(parseInt(req.query.extendToken) >= 365) { 
                days = 365
            }
            else{
                days = parseInt(req.query.extendToken)
            }
        }
        // generate jwt token 
        const token = await user.generateAuthToken(days)
        res.status(202).send({user, token})
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

// post, login
// TODO - send JWT via email
// 2 endpoint used to retrieve your credentials
// different default for JWT 
router.patch("/users/login", async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.emailAddress, req.body.password)
        // query string, for jwt extension, will not allow greater then 365, default 2 days
        var days = 14
        if(req.query.extendToken && typeof parseInt(req.query.extendToken) === 'number'){
            if(parseInt(req.query.extendToken) >= 365) { 
                days = 365
            }
            else{
                days = parseInt(req.query.extendToken)
            }
        }
        // generate jwt token
        const token = await user.generateAuthToken(days)
        res.status(200).send({user, token})
    } catch (e) {
        res.status(500).send({
            error: e.message
        })
    }    
})

// post, reset
// TODO - send password
router.get("/users/:id/reset", async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(404).send({error: "User Not Found"})
        }
        // already reset
        if(user.loginFailure === 0){
            return res.status(400).send({error: "Account unlocked"})
        }
        // random password returned
        const pass = random('Aa0', 12)
        // user.userConfirmed = false
        user.loginFailure = 0
        user.password = pass
        await user.save()
        // res.redirect(`/users/${req.params.id}/confirm?userModified=true`)
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
        // return values that are not equal to req.token 
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
router.post("/users/logoutAll", auth, async (req, res) => {
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
        // create a virtual between local _id and author
        await user.populate('network').execPopulate()
        res.status(200).send(user.network)
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

// get, my addresses
router.get("/users/my/addresses", auth, async (req, res) => {
    try {
        const options = {}
        // sort by updatedAt 
        options.sort = {
            'updatedAt': -1
        }
        const user = await User.findById(req.user.id)
        // create a virtual between local _id and owner
        await user.populate({ path:'address', options }).execPopulate()
        res.status(200).send(user.address)
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

// patch, me
router.patch("/users/me", auth, async (req, res) => {
    // allow only specific keys within req.body 
    const exclude = ['n','loginFailure','userAdmin','userRoot']
    const isValid = valid(req.body, User.schema.obj, exclude)
    if (!isValid) {
        return res.status(400).send({
            error: "Please provide valid data"
        })
    }
    try {
        const body = Object.keys(req.body)
        // for each key within body update corresponding key
        body.forEach(value => {
            req.user[value] = req.body[value]
        })
        await req.user.save()
        res.status(200).send(req.user)
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

// delete, me
router.delete("/users/me", auth, async (req, res) => {
    try {
        await req.user.remove()
        res.status(200).send(req.user)
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

// exports
module.exports = router