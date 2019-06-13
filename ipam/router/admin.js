const express = require('express')
const User = require('../model/user')
const auth = require('../middleware/auth')
const router = new express.Router()
const valid = require('../src/util/compare')

// get, all users
router.get('/admins/users', auth, async (req, res) => {
    try {
        var options = {}
        if (req.query.limit) { 
            options.limit = parseInt(req.query.limit)
        }else{
            options.limit = parseInt(req.user.maxCount)
        }
        if (req.query.skip) {
            options.skip = parseInt(req.query.skip)
        }
        const user = await User.find({},null, options)
        res.status(200).send(user)
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

// get, id
router.get('/admins/users/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) {
           return res.status(404).send({message:'Not Found'})
        }
        res.status(200).send(user)
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

// parse body for allowed fields 
router.patch('/admins/users/:id', auth, async (req, res) => {
    const exclude = ['n', 'userName', 'password']
    const isValid = valid(req.body, User.schema.obj, exclude)
    if (!isValid) {
       return res.status(400).send({message:'Please provide a valid input'})
    }
    try {
        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(404).send({message:'Not Found'})
        }
        const body = Object.keys(req.body)
        body.forEach(value => {
            user[value] = req.body[value]
        })
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
                return res.status(404).send({message:'Not Found'})
            }
            if(!user.userConfirmed){
                return res.status(404).send({message:'Non verified user'})
            }
            root.userRoot = false
            await root.save()
        }
        await user.save()
        res.status(200).send(user)
    } catch (e) {
        res.status(500).send({error: e.message})
    }    
})

router.delete('/admins/users/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if(!user){
            return res.status(404).send({message:'User Not Found'})
        }
        await user.remove()
        res.status(200).send(user)
    } catch (e) {
        res.status(500).send({error: e.message})
    }
})

module.exports = router 