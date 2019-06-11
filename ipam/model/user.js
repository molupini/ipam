// schema created allow for pre and post hooks. 
const mongoose = require('mongoose')
const validator = require('validator')
const Filter = require('bad-words')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Address = require('../model/address')
const Schedule = require('../model/schedule')
const message = require('../email/message')
const random = require('randomatic')

const userSchema = new mongoose.Schema({
    n:{
        type: Number,
        required: true,
        default: 0
    },
    emailAddress: {
        type: String,
        lowercase: true,
        required: true,
        trim: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Please provide a valid email address")
            }
        },
        unique: true
    },
    userName: {
        type: String,
        lowercase: true,
        required: true,
        trim: true,
        minlength:2,
        validate(value) {
            const filter = new Filter()
            if (filter.isProfane(value)) {
                throw new Error("profanity is not allowed")
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        validate(value) {
            if (value.toLowerCase().includes("password")) {
                throw new Error("Please provide a valid password")
            }
        }
    },
    mobilePhone: {
        type: String,
        required: true,
        validate(value) {
            if (!validator.isMobilePhone(value, "en-ZA")) {
                throw new Error("Please provide a South African mobile number")
            }
        }
    },
    loginFailure :{
        type: Number,
        required: true,
        default: 0
    },
    userAdmin :{
        type: Boolean,
        default: false,
        required: true
    }, 
    userRoot :{
        type: Boolean,
        default: false,
        required: true
    }, 
    userConfirmed: {
        type: Boolean,
        default: false,
        required: true
    }, 
    userNoc: {
        type: Boolean,
        default: false,
        required: true
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: true 
})

userSchema.virtual('network', {
    ref: 'Network',
    localField: '_id',
    foreignField: 'author'
})

userSchema.virtual('address', {
    ref: 'Address',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.methods.toJSON = function () {
    const thisObject = this.toObject()
    if (!thisObject.userAdmin){
        delete thisObject.n
        delete thisObject.userConfirmed
        delete thisObject.userNoc
        delete thisObject.password
        // delete thisObject.tokens
        delete thisObject.loginFailure
        delete thisObject.userAdmin
        delete thisObject.userRoot
        delete thisObject.createdAt
        delete thisObject.updatedAt
        delete thisObject.__v
    } else if (thisObject.userAdmin){
        if(!thisObject.userAdmin){
            delete thisObject.userNoc
            delete thisObject.userRoot
        }
        // delete thisObject.tokens
        delete thisObject.password
    }
  
    return thisObject
} 

// methods are accessible on the instances - instance methods 
userSchema.methods.generateAuthToken = async function (days = process.env.MIN_JWT_TTL) {
    const user = this
    // query string, for jwt extension, will not allow greater then 365,
    // default 2 days
    var extension = parseInt(days)
    if (isNaN(extension) || extension < process.env.MIN_JWT_TTL) {
        days = process.env.MIN_JWT_TTL
     }
    if(extension > 1){
        if (extension >= process.env.MAX_JWT_TTL){
            extension = process.env.MAX_JWT_TTL
        } else {
            extension = extension
        }
        days = extension
    }
    // jwt module use secret to generate a jwt and add to array
    const token = await jwt.sign({
        _id: user._id.toString()
    }, process.env.JSON_WEB_TOKEN_SECRET, { expiresIn: `${parseInt(days)} days` }) // days
    // add to tokens array
    user.tokens = user.tokens.concat({
        token
    })
    // tokens array length, remove stale elements
    if (user.tokens.length > process.env.MAX_ARRAY_LENGTH) {
        user.tokens.shift()
    }
    await user.save()
    return token
}

userSchema.methods.restPassword = async function () {
    const user = this
    // random password returned
    const pass = random('Aa0', 12)
    // user.userConfirmed = false
    user.loginFailure = 0
    user.password = pass

    return pass
}

// statics methods are accessible on the models - model methods  
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ emailAddress: email })
    if (!user) {
        throw new Error('User Not Found')
    }
    // if login failure 3 and more, account lockout
    if(user.loginFailure >= 3){
        await message.userReset(user.emailAddress, user.userName, user._id)
        throw new Error('Account locked')
    }
    const isMatch = await bcryptjs.compare(password, user.password)
    // if false, login failure increment 
    if (!isMatch) {
        await user.loginFailure++
        await user.save()
        throw new Error('Mismatch username or password')
    }
    // if successful reset to zero and userNoc to false
    user.loginFailure = 0
    if(user.userNoc){
        user.userNoc = false
    }
    await user.save()
    // return user 
    return user
}

// pre, before saving 
// note some mongoose functions will not work with the schema middleware, bypass 
// needs to be standard function as arrow functions don't bind 'this' below as in this object 
userSchema.pre('save', async function (next) {
    const user = this
    
    // is new document 
    if(user.createdAt === user.updatedAt){
        // user creation count, userRoot, userAdmin role assigned to count 'n' 0
        const num = await User.countDocuments()
        if (user.isModified("password")) {
            user.password = await bcryptjs.hash(user.password, 8)
        }
        user.n = num 
        if(user.n === 0){
            user.userRoot = true
            user.userAdmin = true
            // create a default init address endpoint schedule, used by scanner(s)
            const schedule = await new Schedule({
                author: user.id,
                // endpoint: 'address', 
                // eventFired: false,
                // weekdaySchedule: 6,
                // cronSchedule: '* 1 * * * *'           
            })
            await schedule.save()
        }
        // if successful save confirmation email will be sent
        // await message.userCreated(user.emailAddress, user.userName, user.id)
    }
    // is a old document
    if(user.createdAt !== user.updatedAt){
        if (!user.userConfirmed) {
            throw new Error('Please confirm email address')
        } 
        if(user.isModified("password")){
            user.password = await bcryptjs.hash(user.password, 8)
        }
        if (user.isModified("emailAddress")) {
            user.userConfirmed = false
            // if successful save user modified email will be sent
            await message.userModified(user.emailAddress, user.userName, user._id)
        }
        if(user.isModified("tokens")){
            const jwt = user.tokens[user.tokens.length-1].token
            await message.userJsonWebToken(user.emailAddress, jwt, user.userName)
        }
    }

    // continue 
    next()
})

// delete middleware, change owner on addresses and author on networks
userSchema.pre('remove', async function (next) {
    const user = this
    const num = await User.countDocuments()
    // unable to remove account if userRoot unless only account created
    if(num > 1 && user.userRoot === true){
        throw new Error('Nominate root user')
    }
    // remove all addresses owned by account
    await Address.updateMany({
        owner: user._id
    }, {
        owner: null
    })
    next()
})

const User = mongoose.model("User", userSchema)

module.exports = User