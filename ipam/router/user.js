// modules
const express = require("express")
const User = require("../model/user")
const auth = require("../middleware/auth")
const router = new express.Router()
const valid = require("../src/util/compare")
const { confirmUser } = require('../email/message')
const random = require('randomatic')

// CRUD
// create user
router.post("/users/create", async (req, res) => {
    try {
        const user = await new User(req.body)
        await user.save()
        res.status(201).send(user)
        confirmUser(user.emailAddress, user.id)
    } catch (e) {
        res.status(500).send(e)
    }
})

// get, confirm user 
// TODO, confirm only allow once
router.get("/users/:id/confirm", async (req, res) => {
    try {
        const _id = req.params.id
        const user = await User.findByIdAndUpdate(_id, {
            userConfirmed: true
        })
        if (!user) {
            return res.status(404).send({error: "User Not Found"})
        }
        const token = await user.generateAuthToken(30)
        res.status(202).send({
            "emailAddress": user.emailAddress,
            "userConfirmed": true,
            "token": token
        })
    } catch (e) {
        res.status(500).send(e)
    }
})

// post, login
router.post("/users/login", async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.emailAddress, req.body.password)
        const token = await user.generateAuthToken(30)
        res.status(200).send({user, token})
    } catch (e) {
        res.status(500).send({
            error: e.message
        })
    }    
})

// post, reset
// TODO reset, one time only when account locked
// TODO password should be temp and redirect user to patch('/users/me') but for now leave as is
router.patch("/users/:id/reset", async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(404).send({error: "User Not Found"})
        }
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
router.get("/users/me/networks", auth, async(req, res) => {
    try {
        const user = await User.findById(req.user.id)
        await user.populate('network').execPopulate()
        res.status(200).send(user.network)
    } catch (e) {
        res.status(500).send(e)
    }
})

// get, my addresses
router.get("/users/me/addresses", auth, async (req, res) => {
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
            error: "Please provide a valid input"
        })
    }
    try {
        const body = Object.keys(req.body)
        body.forEach(value => {
            user[value] = req.body[value]
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