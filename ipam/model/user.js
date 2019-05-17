// schema's created allow for pre and post hooks. 
const mongoose = require("mongoose")
const validator = require("validator")
const Filter = require("bad-words")
const bcryptjs = require("bcryptjs")
const jwt = require("jsonwebtoken")
const Address = require("../model/address")
const { accountRest } = require('../email/message')

const userSchema = new mongoose.Schema({
    emailAddress: {
        type: String,
        lowercase: true,
        required: true,
        trim: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Please provide a valid email address")
            }
        }
        ,
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
    // userLocked :{
    //     type: Boolean,
    //     default: false
    // }, 
    userConfirmed: {
        type: Boolean,
        default: false
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
    delete thisObject.tokens
    return thisObject
} 

// methods are accessible on the instances - instance methods 
// need to use a unqiue payload 
userSchema.methods.generateAuthToken = async function (days) {
    const user = this

    const token = jwt.sign({
        _id: user._id.toString()
    }, process.env.JSON_WEB_TOKEN_SERCET, { expiresIn: `${parseInt(days)} days` }) // days

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
    if(user.loginFailure >= 3){
        await accountRest(user.emailAddress, user.userName, user._id)
        throw new Error('Account locked')
    }
    if (!user.userConfirmed) {
        throw new Error('Please confirm email')
    }
    const isMatch = await bcryptjs.compare(password, user.password)
    if (!isMatch) {
        await user.loginFailure++
        await user.save()
        throw new Error('Mismatch username or password ')
    }

    user.loginFailure = 0
    await user.save()

    return user
}

// pre, before saving 
// note some mongoose functions will not work with the schema middleware, bypass 
// needs to be standard function as arrow functions don't bind 'this' below as in this object 
userSchema.pre('save', async function (next) {
    const user = this
    if (user.isModified("password")) {
        // console.log(`user.save() password ${user.password}`)
        user.password = await bcryptjs.hash(user.password, 8)
        user.userConfirmed = false
    }
    if (user.isModified("emailAddress") || user.isModified("userName")) {
        user.userConfirmed = false
    }
    next()
})

// delete middelware, change owner on addresses and author on networks
userSchema.pre('remove', async function (next) {
    const user = this
    await Address.updateMany({
        owner: user._id
    }, {
        owner: null
    })
    next()
})

const User = mongoose.model("User", userSchema)

module.exports = User