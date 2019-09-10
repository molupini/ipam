const tcp = require('tcp-port-used')
const ping = require('ping') 
const dns = require('dns').promises
const moment = require('moment')
const { logger } = require('../util/log')


var doTcpCheck = async function (ip, port) {
    try {
        const test = await tcp.check(parseInt(port), ip)
        if (test) {
            return test === true
        } else {
            return test
        }
        } catch (e) {
            throw new Error(e)
        }
}

var doPingCheck = async function (ip) {
    try {
        const pong = await ping.promise.probe(ip.address)
        const testResult = {
            id: ip._id,
            host: pong.host,
            alive: pong.alive,
            port: ip.portNumber
        }
        return testResult
    } catch (e) {
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

var pingLoop = async function (addresses){
    try {
        let resultArray = []
        for (i = 0; i < addresses.length; i++) {
            await doPingCheck(addresses[i]).then((pingResult) => {
                // debugging
                // logger.log('info', `${moment()} pingResult ${pingResult.id} ${pingResult.host} ${pingResult.alive}`)
                resultArray.push(pingResult)
            })
        }
        return resultArray
    } catch (e) {
        throw new Error(e)
    }
}

var tcpLoop = async function (addresses, ports){
    let resultArray = []
    try {
        for (i = 0; i < addresses.length; i++) {
            // UNION PORTS WITH SUGGESTED 
            let copyPorts = ports.slice()
            const index = copyPorts.indexOf(addresses[i].portNumber)
            if(index !== -1){
                copyPorts.splice(index, 1)
                copyPorts.unshift(addresses[i].portNumber)
            }else{
                copyPorts.unshift(addresses[i].portNumber)
            }
            const set = new Set(copyPorts)
            const array = Array.from(set)
            for (x = 0; x < array.length; x++){
                await doTcpCheck(addresses[i].address, array[x]).then(() => {
                    const testResult = `${addresses[i]._id}:${addresses[i].address}:true`
                    // debugging
                    // logger.log('info', `${moment()} --- doTcpCheck ${testResult} ---`)
                    resultArray.push(testResult)
                    // alive address found stop loop
                    x = array.length
                }).catch(() => {
                    const testResult = `${addresses[i]._id}:${addresses[i].address}:false`
                    // debugging
                    // logger.log('info', `${moment()} doTcpCheck ${testResult}`)
                    resultArray.push(testResult)
                })
            }

            
        }
        return resultArray
    } catch (e) {
        throw new Error(e)
    }
}


module.exports = {
    doTcpCheck,
    doPingCheck,
    doDNSCheck, 
    pingLoop,
    tcpLoop
}