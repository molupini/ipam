// User router
// authentication required for operating IP Address Manager solution
// Basic CRUD operation 
const express = require('express')
const User = require('../model/user')
const auth = require('../middleware/auth')
const router = new express.Router()
const valid = require('../src/util/compare')
const message = require('../email/message')


// create user
router.post('/users/create', async (req, res) => {
    try {
        const user = await new User(req.body)
        await user.save()
        await message.userCreated(user.emailAddress, user.userName, user.id)
        res.status(201).send(user)
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

// get, confirm user
// 1 endpoint used to retrieve your credentials
router.get('/users/:id/confirm', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(404).send({message:'User Not Found'})
        }
        // already confirmed
        if(user.userConfirmed === true){
            return res.status(400).send({message:'User confirmed'})
        }
        // confirm user account 
        user.userConfirmed = true
        // user account modified by user reset endpoint
        if(req.query.userModified === 'true') {
            user.save()
            // return res.redirect('/users/login')
            return res.status(202).send(user)
        }
        // generate jwt token 
        const token = await user.generateAuthToken(req.query.extendToken)
        res.status(202).send({user, token})
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

// post, login
// 2 endpoint used to retrieve your credentials
// different default for JWT 
// parse body for only emailAddress and password
router.patch('/users/login', async (req, res) => {
    try {
        // user login by emailAddress and password
        const user = await User.findByCredentials(req.body.emailAddress, req.body.password)
        if(user){
            // generate jwt token
            const token = await user.generateAuthToken(req.query.extendToken)
            res.status(202).send({user, token})
        }
    } catch (e) {
        res.status(500).send({error: e.message})
    }    
})

// post, reset
router.get('/users/:id/reset', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(404).send({message:'User Not Found'})
        }
        // already reset
        if(user.loginFailure === 0){
            return res.status(400).send({message:'Account unlocked'})
        }
        const pass = await user.restPassword()
        await user.save()
        // res.redirect(`/users/${req.params.id}/confirm?userModified=true`)
        res.status(202).send({user, pass})
    } catch (e) {
        res.status(500).send({error: e.message})
    }    
})

// logout, current session
router.post('/users/logout', auth, async (req, res) => {
    try {
        if(req.user.tokens.length > 1){
            req.user.tokens = req.user.tokens.filter(token => token.token !== req.token)    
            await req.user.save()
        }else{
            const user = await User.findByIdAndUpdate(req.user.id, {
                tokens: []
            })
            await user.save()
        }
        return res.status(200).send()
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

// logout, all sessions
// helpful when more then one device or a shared account
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.user.id, {
            tokens: []
        })
        await user.save()
        res.status(200).send()
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

// get, me
router.get('/users/me', auth, (req, res) => {
    res.status(200).send(req.user)
})

// get, my networks
router.get('/users/my/networks', auth, async(req, res) => {
    try {
        var options = {}
        if (req.query.limit) { 
            options.limit = parseInt(req.query.limit)
        }else{
            options.limit = parseInt(process.env.MAX_QUERY_LIMIT)
        }
        if (req.query.skip) {
            options.skip = parseInt(req.query.skip)
        }
        options.sort = {
            'updatedAt': -1
        }
        const user = await User.findById(req.user.id)
        // create a virtual between local _id and author
        await user.populate({path:'network', options}).execPopulate()
        user.network.forEach(network => {
            network.updateNumHosts(network._id)
        })
        res.status(200).send(user.network)
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

// get, my addresses
router.get('/users/my/addresses', auth, async (req, res) => {
    try {
        var options = {}
        if (req.query.limit) { 
            options.limit = parseInt(req.query.limit)
        }else{
            options.limit = parseInt(process.env.MAX_QUERY_LIMIT)
        }
        if (req.query.skip) {
            options.skip = parseInt(req.query.skip)
        }
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
// parse body for allowed fields 
router.patch('/users/me', auth, async (req, res) => {
    // allow only specific keys within req.body 
    const exclude = ['n','loginFailure','userAdmin','userRoot']
    const isValid = valid(req.body, User.schema.obj, exclude)
    if (!isValid) {
        return res.status(400).send({message:'Please provide valid data'})
    }
    try {
        const body = Object.keys(req.body)
        // for each key within body update corresponding key
        body.forEach(value => {
            req.user[value] = req.body[value]
        })
        await req.user.save()
        res.status(202).send(req.user)
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

// delete, me
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        res.status(200).send(req.user)
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

// exports
module.exports = router