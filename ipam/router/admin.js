const express = require('express')
const User = require('../model/user')
const auth = require('../middleware/auth')
const router = new express.Router()
const valid = require("../src/util/compare")

// get, all users
router.get('/admins/users', auth, async (req, res) => {
    try {
        const user = await User.find({})
        res.status(200).send(user)
    } catch (e) {
        res.status(500).send(e)
    }
})

// get, id
router.get('/admins/users/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) {
           return res.status(404).send('Not Found')
        }
        // debugging
        // console.log('user :', user);
        res.status(200).send(user)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.patch("/admins/users/:id", auth, async (req, res) => {
    const exclude = ['n', 'userName', 'password']
    const isValid = valid(req.body, User.schema.obj, exclude)
    if (!isValid) {
       return res.status(400).send("Please provide a valid input")
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
        // if userRoot specified and authentication passed in auth middleware, 
        // find existing and remove privileges, only one root account possible
        const options = {}
        // sort by updatedAt ascending, note -1 is descending 
        options.sort = {
            'updatedAt': 1
        }
        if(body.indexOf('userRoot') !== -1){
            const root = await User.findOne({userRoot: true}, null, options)
            // first item in array
            if(!root){
                return res.status(404).send('Not Found')
            }
            root.userRoot = false
            await root.save()
        }
        res.status(200).send(user)
    } catch (e) {
        res.status(500).send(e)
    }    
})

router.delete('/admins/users/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if(!user){
            return res.status(404).send("User Not Found")
        }
        await user.remove()
        await res.status(200).send(user)
    } catch (e) {
        await res.status(500).send()
    }
})

module.exports = router 