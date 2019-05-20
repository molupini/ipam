// schema created allow for pre and post hooks. 
const mongoose = require("mongoose")
const validator = require("validator")
const Filter = require("bad-words")
const bcryptjs = require("bcryptjs")
const jwt = require("jsonwebtoken")
const Address = require("../model/address")
const message = require('../email/message')

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
    // delete thisObject.userConfirmed
    // delete thisObject.password
    // delete thisObject.tokens
    return thisObject
} 

// methods are accessible on the instances - instance methods 
// need to use a unique payload 
userSchema.methods.generateAuthToken = async function (days) {
    const user = this
    // jwt module use secret to generate a jwt and add to array
    const token = jwt.sign({
        _id: user._id.toString()
    }, process.env.JSON_WEB_TOKEN_SECRET, { expiresIn: `${parseInt(days)} days` }) // days
    // add to tokens array
    user.tokens = user.tokens.concat({
        token
    })
    await user.save()
    return token
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
    // if successful reset to zero 
    user.loginFailure = 0
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
        if (user.isModified("password")) {
            user.password = await bcryptjs.hash(user.password, 8)
        }
        if(user.n === 0){
            user.userRoot = true
            user.userAdmin = true
        }
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