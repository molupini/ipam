// modules 
const iprange = require('iprange')
const ip = require('ip')
const Cidr = require('../../model/cidr')
const Address = require('../../model/address')

// function
// TODO CREATE SCOPE AND WITH EVERY EXCLUSION REMOVE DOCUMENTS THAT MATCH WHILE KEEPING THE REMAINING 
const seedIpAddresses = async (network, build=false) => {
    const cidrSubnet = `${network.networkAddress}/${network.subnetMaskLength}`
    const range = await iprange(cidrSubnet)
    if(range){
        for (a = 0; a < range.length; a++) {
            if(network.lastAddress === range[a]){
                network.loadingAddress = false
                await network.save()
            }
            if(range[a] === network.networkAddress || range[a] === network.firstAddress || range[a] === network.lastAddress || range[a] === network.broadcastAddress || range[a] === network.defaultGateway){
                continue
            } 
            else {
                if(build){
                    addr = await new Address({
                        address: range[a],
                        author: network.id,
                        cloudHosted: network.cloudHosted
                    })
                    await addr.save()     
                }
                else {
                    var addr = await Address.findOne({
                        address: range[a]
                    })
                    if(!addr){
                        addr = await new Address({
                            address: range[a],
                            author: network.id,
                            cloudHosted: network.cloudHosted
                        })
                        await addr.save()       
                    }
                }
            }
            
        }
    }
}

const scopeExclusionCheck = async (network) => {
    
    var cidr = null
    var re = null 
    // debugging
    console.log('network =')
    console.log(network)
    
    // ITERATE OVER EXCLUSIONS
    for (i = 0; i < network.cidrExclusion.length; i++) {
        const exclusion = network.cidrExclusion[i]
        // debugging
        console.log('exclusion =')
        console.log(exclusion)

        // BUILD EXCLUSION FROM TO RANGE REGEX
        if(exclusion.match(/(\-)/)){
            cidr = await Cidr.findOne({
                fromToRange: exclusion
            })
            if(!cidr){
                throw new Error('Cidr not Found')
            }
            // provide regex
            re = new RegExp(cidr.regexPattern)
            // debugging
            console.log('re =')
            console.log(re)
            const removed = await Address.deleteMany({"address": {$regex: re}})
            // debugging
            console.log('removed =')
            console.log(removed)
            if(network.cidrExclusion.length === i){
                network.loadingExclusion === false
            }
        }
        // for (x = 0; x < range.length; x++) {
        //     const address = range[x]
        //     var isExcluded = false
        //     // console.log(address)
        //     if (address === firstAddress || address === lastAddress || address === subnetMask || address === broadcast || address === gateway) {
        //         continue
        //     } else {
        //         // EXCLUSION IS SHORT HAND NOTATION 
        //         if(exclusion !== undefined){
        //             if(exclusion.match(/(\/)/)){
        //                 isExcluded = ip.cidrSubnet(exclusion).contains(address)
        //                 // debugging
        //                 // console.log('exclusion / =')
        //                 // isExcluded = isExcluded === true ? false : true
        //                 // if (!isExcluded) {
        //                 //     // addressesArray.push({ip: address})
        //                 // }
        //             }
        //             // EXCLUSION IS LONG HAND NOTATION, FROM TO RANGE
        //             else if (exclusion.match(/(\-)/)){
        //                 // debugging
        //                 // console.log('exclusion - =')
        //                 isExcluded = address.match(re) === null ? false : true
                        
        //                 // if (!address.match(re)){
        //                 //     // addressesArray.push({ip: address})
        //                 // }
        //             }
        //             // debugging

        //             console.log('address =')
        //             console.log(address)
        //             console.log('isExcluded =')
        //             console.log(isExcluded)
        //             // ADDRESS
        //             // var addr = null
        //             // if(!isExcluded){
        //             //     addr = Address.findOne({
        //             //         address: address
        //             //     })
        //             //     if(!addr){
        //             //         addr = new Address({
        //             //             address: address,
        //             //             author: id,
        //             //             cloudHosted: hosted
        //             //         })
        //             //         addr.save()
        //             //     }
        //             //     // debugging
        //             //     console.log('addr =')
        //             //     console.log(addr)
        //             // }
        //         }
        //     }

        // }
        
    }
    return null
}

const ipVaild = (cidr, address) => {
    return ip.cidrSubnet(cidr).contains(address)
}

const ipV4 = (address) => {
    return ip.isV4Format(address)
}

const hostNetworkBuilder = (first, last, base) => {
    // debugging
    // console.log('base =')
    // console.log(base)
    const array = base.split(',')
    var result = ''
    for(x = 0; x < array.length; x++){
        const temp = array[x][array[x].length-1] !== '.' ? array[x] += '.' : array[x]
        // const temp = array[x]
        for (y = first; y <= last; y++){
            result += `${temp}${y}\,`
        }
    }
    // debugging
    // console.log('result =')
    // console.log(result)
    return result.replace(/\,$/, '')
}

const rangeBuilder = (start, end, mask) => {
    // TESTING
    // start = '10.0.0.0'
    // end = '10.0.1.1'
    // mask = '255.255.0.0'

    // BASE STRING
    var base = ''
    // RETURN ARRAY
    var result = []

    // ITERATE OVER 4 OCTETS, START IP AND END IP INCLUDE MASK  
    for (w = 0; w < 4; w++){
        
        var first = parseInt(start.split('.')[w])
        var last = parseInt(end.split('.')[w])
        const m = parseInt(mask.split('.')[w])
        
        // IF MASK IS 255 THEN ADD TO THE BASE STRING FIRST || LAST 
        if (m === 255){
            base += `${first}${'.'}`
            // base += `~${'.'}`
        } 
        else {
            base = hostNetworkBuilder(first, last, base)
        }
        if (w === 3){
            result = base
        }
    }
    // debugging
    // console.log('base =')
    // console.log(base)
    // console.log('result =')
    // console.log(result)
    return result.split(',')
}

module.exports = {
    scopeExclusionCheck,
    ipVaild,
    rangeBuilder,
    ipV4,
    seedIpAddresses, 
    
}