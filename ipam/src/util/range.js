// modules 
const iprange = require("iprange")
const ip = require("ip")

// function
const ipScope = (cidrSubnet, cidrExclusion) => {
        const iprangeArray = iprange(cidrSubnet)
        addressesArray = []
        for (i = 0; i < cidrExclusion.length; i++) {
            for (x = 0; x < iprangeArray.length; x++) {
                const address = iprangeArray[x]
                const exclusion = cidrExclusion[i]
                const isExcluded = ip.cidrSubnet(exclusion).contains(address)
                if (isExcluded) {
                    addressesArray.push(address)
                }
            }
        }
        addressesObject = []
        for (i = 0; i < iprangeArray.length; i++) {
            const address = iprangeArray[i]
            if (addressesArray.indexOf(address) === -1) {
                addressesObject.push({
                    ip: address
                })
            }
        }
        return addressesObject
}

const ipVaild = (cidr, address) => {
    return ip.cidrSubnet(cidr).contains(address)
}

const ipV4 = (address) => {
    return ip.isV4Format(address)
}

// expv
module.exports = {
    ipScope,
    ipVaild,
    ipV4
}