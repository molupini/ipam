// modules
const mongoose = require("mongoose")
const validator = require("validator")
const message = require('../email/message')
const User = require('../model/user')

// TODO add FQDN field 
const addressSchema = new mongoose.Schema({
    address: {
        // type: []
        type: String,
        validate(value) {
            if (!validator.isIP(value, 4)) {
                throw new Error("Please provide a valid Address")
            }
        },
        unique: true
    },
    isAvailable: {
        type: Boolean, 
        default: false
    },
    count: {
        type: Number,
        default: 0
    },
    falseCount: {
        type: Number,
        default: 0
    },
    trueCount: {
        type: Number,
        default: 0
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Network'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        default: null,
        ref:'User'
    }
}, {
    timestamps: true
})

addressSchema.virtual('network', {
    ref: 'Network',
    localField: 'author',
    foreignField: '_id'
})

// toJSON
addressSchema.methods.toJSON = function () {
    const address = this.toObject()
    // delete address.falseCount
    return address
}

// pre save
addressSchema.pre("save", async function (next) {
    const address = this
    if (address.isModified('isAvailable')) {
        address.trueCount = 0
        address.falseCount = 0
    }

    if (!address.isNew && address.trueCount > 0){

        var fp = parseInt(process.env.TRUE_COUNT_THRESHOLD)
        if(fp % 2 !== 0 && fp > 20){
            fp = 60
        }

        // debugging 
        // console.log('TRUE_COUNT_THRESHOLD =',fp)
        if (address.owner !== null && address.trueCount > fp) {
            // if above threshold, release address back into the wild!
            // debugging 
            // console.log({error: `Address ${address.address}, Owner ${address.owner}, trueCount ${address.trueCount}`})
            // address.owner = null
        } 
        else if (address.owner !== null && address.trueCount > fp/2) {
            // elseif above threshold, send warning to owner to verify and add port well known ports array
            // debugging 
            // console.log({warning: `Address ${address.address}, Owner ${address.owner}, trueCount ${address.trueCount}`})
            // await message.addressTrueCount(user.emailAddress, address.address, address.owner)
        }else {
            // else, other
            // debugging 
            // console.log({info: `Address ${address.address} status, ${address.isAvailable}`})
        }
    }
    if (!address.isNew && address.falseCount > 0){
        // debugging 
        // console.log({info: `Address ${address.address} status, ${address.isAvailable}`})
    }

    next()
})

// export
const Address = mongoose.model("Address", addressSchema)

module.exports = Address