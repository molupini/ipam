const tcp = require("tcp-port-used")
const ping = require('ping') 
const dns = require('dns').promises

var doTcpCheck = async function (port, ip) {
    try {
        // debugging only
        // console.log(port, ip)
        const test = await tcp.check(port, ip)
        if (test) {
            return test === true
        } else {
            return test
        }
        } catch (e) {
            throw new Error(e.message)
        }
}

var doPingCheck = async function (ip) {
    try {
        const pong = await ping.promise.probe(ip)
        const test = pong.alive
        // debugging 
        // console.log('doPingCheck()')
        // console.log(test)
        return test
    } catch (e) {
        // debugging
        // console.log('doPingCheck e:', e)
        throw new Error(e)
    }
}

var doDNSCheck = async function (ip) {
    try {
        const test = await dns.resolve(ip, 'PTR') // resolvePtr,resolveAny,reverse
        if (!test) {
            return test
        }
        return test            
    } catch (e) {
        throw new Error(e.code) // e.code
    }
}

module.exports = {
    doTcpCheck,
    doPingCheck,
    doDNSCheck
}