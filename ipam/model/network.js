const mongoose = require('mongoose')
const validator = require('validator')
const moment = require('moment')
const ip = require('ip')
// const iprange = require('iprange')
const Address = require('../model/address')
const Cidr = require('../model/cidr')
const { scopeExclusionCheck, seedIpAddresses } = require('../src/util/range')

const networkSchema = new mongoose.Schema({
    networkAddress: {
        type: String,
        trim: true,
        required: true,
        validate(value) {
            if (!validator.isIP(value,4)) {
                throw new Error('Please provide a valid Network Address')
            }
        }
        ,
        unique: true,
        index: true
    },
    subnetMask: {
        type: String,
        required: true,
        trim: true,
        validate(value) {
            if (!validator.isIP(value,4)) {
                throw new Error('Please provide a valid subnet mask')
            }
        }
    }, 
    firstAddress: {
        type: String,
        default: '0.0.0.0'
    },
    lastAddress:{
        type: String,
        default: '0.0.0.0'
    },
    broadcastAddress:{
        type: String,
        default: '0.0.0.0'
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
        default: '0.0.0.0'
    },
    VLAN: {
        type: Number,
        default: 0
    },
    cidrExclusion: {
        type: Array,
        default: []
    },
    dnsServers: {
        type: Array,
        default: ['8.8.8.8', '1.1.1.1']
    },
    networkConfirmed: {
        type: Boolean,
        default: false
    },
    cloudHosted: {
        type: Boolean,
        default: false
    },
    loadingAddress: {
        type: Boolean,
        default: false
    },
    loadingExclusion: {
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

// networkSchema.virtual('cidr', {
//     ref: 'Cidr',
//     localField: '_id',
//     foreignField: 'author'
// })

// toJSON
networkSchema.methods.toJSON = function () {
    const network = this
    const networkObject = network.toObject()
    // delete networkObject.networkConfirmed
    return networkObject
}

networkSchema.methods.updateNumHosts = async function (id, free=true) {
    var amount = 0
    if(free === 'true'){
        amount = await Address.countDocuments({
            author: id,
            isInitialized: true,
            isAvailable: true,
            owner: null
        })
    } else if (free === 'false') {
        amount = await Address.countDocuments({
            author: id
        })
    }

    return amount
}

// pre Save
networkSchema.pre('save', async function (next) {
    const network = this
 
    // allowed modification, note order above first post/save below
     const cidr = `${network.networkAddress}/${network.subnetMaskLength}`
     if (network.isModified('defaultGateway') && !ip.cidrSubnet(cidr).contains(network.defaultGateway)) {
         throw new Error('Please provide a valid gateway')
    }

     if (network.isModified('VLAN') && (network.VLAN < 0 || network.VLAN > 4094)) {
         throw new Error('Please provide a valid vlan')
    }

    // CIDR UPDATES THAT ARE VALID
    if(!network.isNew && network.isModified('cidrExclusion')){

        // REMOVE WHEN CIDR CHANGE FOUND
        await Cidr.deleteMany({
            author: network._id
        })
        // CIDR LOOP
        network.cidrExclusion.forEach(cidr => {
            // IF INCLUDES FORWARD SLASH CIDR NOTATION 
            if(cidr.match(/(\/)/)){
                const cidrAddr = ip.cidr(cidr)
                // RETURN TEST TRUE IF VALID FALSE IF NOT 
                const test = ip.cidrSubnet(`${network.networkAddress}/${network.subnetMaskLength}`).contains(cidrAddr)
                // RETURN MASK
                const mask = ip.cidrSubnet(cidr).subnetMaskLength
                if(mask < network.subnetMaskLength){
                    throw new Error('Invalid exclusion')
                }
                if(!test){
                    throw new Error('Invalid exclusion')
                }
                const pattern = `${ip.cidrSubnet(cidr).firstAddress}-${ip.cidrSubnet(cidr).lastAddress}`
                const cidrModel = new Cidr({
                    author: network.id, 
                    owner: network.author,
                    fromToRange: pattern
                })
                cidrModel.save()
                // debugging
                // console.log(cidrModel)
            }
            // IF INCLUDES DASH CIDR NOTATION 
            if(cidr.match(/(\-)/)){
                if(cidr.split(/(\-)/).length !== 3){
                    throw new Error('Invalid exclusion array length')
                }
                const array = cidr.split(/(\-)/)
                for (i = 0; i < array.length; i++){
                    if(array[i] !== '-'){
                        const test = ip.cidrSubnet(`${network.networkAddress}/${network.subnetMaskLength}`).contains(array[i])
                        if(!test){
                            throw new Error('Invalid exclusion')
                        }
                    }
                }
                const cidrModel = new Cidr({
                    author: network.id, 
                    owner: network.author,
                    fromToRange: cidr
                })
                cidrModel.save()
            }
        })

        if(network.networkConfirmed === true){
            const dateNow = moment()
            const dateExp = moment(network.createdAt)
            const drift = dateExp.diff(dateNow, 'hours')
            if(drift > 24){
                await Address.deleteMany({
                    author: network._id,
                    owner: null
                })
                network.loadingAddress = true
            }

            // IF NETWORK IS NOT NEW, cidrExclusion IS MODIFIED AND NETWORK PREVIOUSLY CONFIRMED SET FALSE TO FORCE USER TO CONFIRMED ONCE MORE
            // RESULT IN LOADING EXCLUSIONS
            network.networkConfirmed = false
        }
    }
    if(!network.isNew && network.loadingAddress === false && network.networkConfirmed === true){
        network.loadingExclusion = true
    }
    // create network
    // networkAddress can not be modified by user
    if (network.isModified('networkAddress')) {
        const subnet = await ip.subnet(network.networkAddress, network.subnetMask)
        network.firstAddress = subnet.firstAddress
        network.lastAddress = subnet.lastAddress
        network.broadcastAddress = subnet.broadcastAddress
        network.subnetMaskLength = subnet.subnetMaskLength
        network.numHosts = subnet.numHosts
        network.defaultGateway = subnet.firstAddress
        var first = subnet.firstAddress 
        firstNum = parseInt(first.split('.')[3])+1
        var last = subnet.firstAddress
        lastNum = parseInt(last.split('.')[3])+3
        network.cidrExclusion.push(`${first.replace(/\d{1,3}$/, firstNum)}-${last.replace(/\d{1,3}$/, lastNum)}`)
        const cidrModel = new Cidr({
            author: network.id, 
            owner: network.author,
            fromToRange: network.cidrExclusion[0]
        })
        cidrModel.save()
        network.loadingAddress = true
    }
    next()
})

networkSchema.post('save', async function (doc, next) {
    try {
        const network = doc
        // const cidrSubnet = `${network.networkAddress}/${network.subnetMaskLength}`
        if (network.loadingAddress === true){
            // debugging
            // console.log('network isNew =')
            // console.log(network.isNew)
            seedIpAddresses(network, true)
        }

        if (network.loadingExclusion === true && network.networkConfirmed === true) {
            scopeExclusionCheck(network)
            await Network.findByIdAndUpdate({
                _id: network.id
            }, {
                loadingExclusion: false
            })
        }
        next()
    } 
    catch (e) {
        console.error(e)
        throw new Error(e)
    }
    
})

// delete addresses when network is removed
networkSchema.pre('remove', async function (next) {
    const network = this
    await Address.deleteMany({ author: network._id })
    await Cidr.deleteMany({ author: network._id })
    next()
})

const Network = mongoose.model('Network', networkSchema)

module.exports = Network