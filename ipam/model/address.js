// modules
const mongoose = require("mongoose")
const validator = require("validator")

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
    next()
})

// export
const Address = mongoose.model("Address", addressSchema)

module.exports = Address