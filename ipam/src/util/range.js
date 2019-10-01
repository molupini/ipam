// modules 
const iprange = require('iprange')
const ip = require('ip')
const Cidr = require('../../model/cidr')

// function
const ipScope = async (cidrSubnet, cidrExclusion, firstAddress, lastAddress, subnetMask) => {
    
    // TODO TESTING BELOW RANGE BUILDER, # 
    // const range = await iprange(cidrSubnet)
    
    // # RANGE BUILDER
    const range = rangeBuilder(firstAddress, lastAddress, subnetMask)
    // debugging
    // console.log('range =')
    // console.log(range)
    var addressesArray = []
    var cidr = null
    var re = null 
    // debugging
    // console.log('network =')
    // console.log(network)
    
    // ITERATE OVER EXCLUSIONS
    for (i = 0; i < cidrExclusion.length; i++) {
        const exclusion = cidrExclusion[i]
        // debugging
        // console.log('exclusion =')
        // console.log(exclusion)

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
            // console.log('re =')
            // console.log(re)
        }
        for (x = 0; x < range.length; x++) {
            const address = range[x]
            // console.log(address)
            
            // EXCLUSION IS SHORT HAND NOTATION 
            if(exclusion !== undefined && exclusion.match(/(\/)/)){
                const isExcluded = ip.cidrSubnet(exclusion).contains(address)
                if (!isExcluded) {
                    addressesArray.push({ip: address})
                }
            }
            // EXCLUSION IS LONG HAND NOTATION, FROM TO RANGE
            else if (exclusion !== undefined && exclusion.match(/(\-)/)){
                if (!address.match(re)){
                    addressesArray.push({ip: address})
                }
            }
        }
    }
    return addressesArray
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
    ipScope,
    ipVaild,
    rangeBuilder,
    ipV4
}