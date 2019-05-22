const mongoose = require("mongoose")
const validator = require("validator")
const ip = require("ip")
const Address = require("../model/address")
const { ipScope } = require("../src/util/range")

const networkSchema = new mongoose.Schema({
    networkAddress: {
        type: String,
        trim: true,
        required: true,
        validate(value) {
            if (!validator.isIP(value,4)) {
                throw new Error("Please provide a valid Network Address")
            }
        }
        ,
        unique: true
    },
    subnetMask: {
        type: String,
        required: true,
        trim: true,
        validate(value) {
            if (!validator.isIP(value,4)) {
                throw new Error("Please provide a valid subnet mask")
            }
        }
    }, 
    firstAddress: {
        type: String,
        default: "0.0.0.0"
    },
    lastAddress:{
        type: String,
        default: "0.0.0.0"
    },
    broadcastAddress:{
        type: String,
        default: "0.0.0.0"
    },
    subnetMaskLength:{
        type: Number,
        default: null
    },
    numHosts:{
        type: Number,
        default: null
    },
    defaultGateway: {
        type: String,
        default: "0.0.0.0"
    },
    VLAN: {
        type: Number,
        default: 0
    },
    cidrExclusion: {
        type: Array,
        default: []
    },
    networkConfirmed: {
        type: Boolean,
        default: false
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
})

networkSchema.virtual('address', {
    ref: 'Address',
    localField: '_id',
    foreignField: 'author'
})

// toJSON
networkSchema.methods.toJSON = function () {
    const network = this
    const networkObject = network.toObject()
    delete networkObject.networkConfirmed
    return networkObject
}

// pre Save
// TODO should evaluate if the below should be moved to individual methods similar to user class to reduce complicity 
networkSchema.pre("save", async function (next) {
    const network = this
    const subnet = await ip.subnet(network.networkAddress, network.subnetMask)
    
    // allowed modification, note order above first post/save below
     const cidr = `${network.networkAddress}/${network.subnetMaskLength}`
     if (network.isModified("defaultGateway") && !ip.cidrSubnet(cidr).contains(network.defaultGateway)) {
         throw new Error("Please provide a valid gateway")
    }

     if (network.isModified("VLAN") && (network.VLAN < 0 || network.VLAN > 4094)) {
         throw new Error("Please provide a valid vlan")
    }

    if (network.isModified("networkConfirmed") && network.networkConfirmed === true) {
        const cidrSubnet = `${network.networkAddress}/${network.subnetMaskLength}`
        const addresses = await ipScope(cidrSubnet, network.cidrExclusion)
        for (i = 0; i < addresses.length; i++) {
            const ip = addresses[i].ip
            if (ip === network.networkAddress || ip === network.firstAddress || ip === network.lastAddress || ip === network.broadcastAddress || ip === network.defaultGateway) {
                // match found and skipped
                continue
            } else {
                const address = await Address({
                    address: ip,
                    author: network._id
                })
                await address.save()
            }
        }
    }
    // create network
    // networkAddress can not be modified by user
    if (network.isModified("networkAddress")) {
        network.firstAddress = subnet.firstAddress
        network.lastAddress = subnet.lastAddress
        network.broadcastAddress = subnet.broadcastAddress
        network.subnetMaskLength = subnet.subnetMaskLength
        network.numHosts = subnet.numHosts
        network.defaultGateway = subnet.firstAddress
        network.cidrExclusion.push(`${subnet.networkAddress}/27`)
        network.cidrExclusion.push(`${subnet.broadcastAddress}/30`)
    }
    next()
})

// delete addresses when network is removed
networkSchema.pre('remove', async function (next) {
    const network = this
    await Address.deleteMany({ author: network._id })
    next()
})

const Network = mongoose.model("Network", networkSchema)

module.exports = Network