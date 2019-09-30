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
        // console.log('network =')
        // console.log(network)
        for (i = 0; i < cidrExclusion.length; i++) {
            
            const exclusion = cidrExclusion[i]
            // debugging
            // console.log('exclusion =')
            // console.log(exclusion)

            if(exclusion.match(/(\-)/)){
                cidr = await Cidr.findOne({
                    fromToRange: exclusion
                })
                if(!cidr){
                    throw new Error('Cidr not Found')
                }
                re = new RegExp(cidr.regexPattern)
                // debugging
                // console.log('re =')
                // console.log(re)
            }

            for (x = 0; x < range.length; x++) {
                const address = range[x]
                // console.log(address)

                if(exclusion !== undefined && exclusion.match(/(\/)/)){
                    const isExcluded = ip.cidrSubnet(exclusion).contains(address)
                    // console.log('exclusion =')
                    // console.log(exclusion)
                    if (!isExcluded) {
                        // console.log('address =')
                        // console.log(address)
                        //  BELOW COMMENT OUT BASED ON BELOW
                        // addressesArray.push(address)
                        addressesArray.push({ip: address})
                    }
                }
                else if (exclusion !== undefined && exclusion.match(/(\-)/)){
                    // const re = new RegExp(reg)
                    // console.log('re =')

                    if (!address.match(re)){
                        // debugging
                        // console.log(address)
                        addressesArray.push({ip: address})
                    }
                }
            }
        }

        // debugging
        // console.log('addressesArray =');
        // console.log(addressesArray)

        // DUPLICATE ITERATION, EVAL IF NECESSARY 
        // var addressesObject = []
        // for (i = 0; i < range.length; i++) {
        //     const address = range[i]
        //     if (addressesArray.indexOf(address) === -1) {
        //         addressesObject.push({
        //             ip: address
        //         })
        //     }
        // }
        //  BELOW RETURN COMMENT OUT BASED ON ABOVE 
        // return addressesObject
        
        return addressesArray
}

const ipVaild = (cidr, address) => {
    return ip.cidrSubnet(cidr).contains(address)
}

const ipV4 = (address) => {
    return ip.isV4Format(address)
}

const hostNetworkBuilder = (first, last, base) => {
    // console.log('base =')
    // console.log(base)
    const array = base.split(',')
    var result = ''
    for(x = 0; x < array.length; x++){
        const temp = array[x][array[x].length-1] !== '.' ? array[x] += '.' : array[x]
        // const temp = array[x]
        for (y = first; y <= last; y++){

            // if(base.split(',')[0].length > 4){
    
            // }
            // console.log('temp =');
            // console.log(temp)

            // ${'.'}
            result += `${temp}${y}\,`
            // result += `${temp}${y}\,`
            
        }
    }

    // console.log('result =')
    // console.log(result)
    return result.replace(/\,$/, '')
}

const rangeBuilder = (start, end, mask) => {
    
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
            // console.log(base)
            // // INNER ARRAY
            // var inner = []
            // for (y = 0; y < base.length; y++){
            //     for (x = first; x <= last; x++){
            //         console.log(`${base[y]}, ${x}`)
            //     }
            // }

        }
        if (w === 3){
            result = base
        }
    }
    // console.log('base =')
    // console.log(base)
    // console.log('result =')
    // console.log(result)
    
    // console.log(result.split(','))
    return result.split(',')
}

module.exports = {
    ipScope,
    ipVaild,
    rangeBuilder,
    ipV4
}