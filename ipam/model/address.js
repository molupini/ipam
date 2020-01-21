// modules
const mongoose = require('mongoose')
const validator = require('validator')

const addressSchema = new mongoose.Schema({
    address: {
        // type: []
        type: String,
        validate(value) {
            if (!validator.isIP(value, 4)) {
                throw new Error('Please provide a valid Address')
            }
        },
        unique: true,
        index: true
    },
    isInitialized:{
        type: Boolean,
        default: false
    },
    isAvailable: {
        type: Boolean, 
        default: false
    },
    cloudHosted: {
        type: Boolean, 
        default: false
    },
    gatewayAvailable: {
        type: Boolean, 
        default: true
    },
    noDNSPointer: {
        type: Boolean, 
        default: true
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
    },
    portNumber:{
       type: String, 
       default: 80, 
       validate(value){
           if(!validator.isPort(value)){
               throw new Error('Please provide valid port')
           }
       }
    },
    fqdn:{
       type: String, 
       default: 'host.unknown',
       trim: true,
       lowercase: true, 
       validate(value){
           if(!validator.isFQDN(value)){
               throw new Error('Please provide valid Full Qualified Domain Name')
           }
       }
    }
}, {
    timestamps: true
})

// virtual(s)  
addressSchema.virtual('network', {
    ref: 'Network',
    localField: 'author',
    foreignField: '_id'
})

// toJSON
addressSchema.methods.toJSON = function () {
    const address = this.toObject()
    return address
}

// pre save
addressSchema.pre('save', async function (next) {
    const address = this
    if (!address.isNew && (address.isModified('isAvailable') || address.isModified('owner'))) {
        address.trueCount = 0
        address.falseCount = 0
        address.count = 0
    }
    next()
})

// export
const Address = mongoose.model('Address', addressSchema)

module.exports = Address