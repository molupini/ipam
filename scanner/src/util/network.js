const tcp = require("tcp-port-used")
const ping = require('ping') 
const dns = require('dns').promises

var doTcpCheck = async function (ip) {
    try {
        // debugging
        // console.log(ip)
        const test = await tcp.check(parseInt(ip.portNumber), ip.address)
        // debugging
        // console.log('doTcpCHeck() :', test)
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
            alive: pong.alive
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
    // debugging
    // console.log(addresses.length)
    try {
        let resultArray = []
        for (i = 0; i < addresses.length; i++) {
            // debugging
            console.log(`${addresses[i]._id}, ${addresses[i].address}, ping`)
            await doPingCheck(addresses[i]).then((pingResult) => {
                // console.log('doPingCheck :', pingResult);
                resultArray.push(pingResult)
            })
            // not handling catch
        }
        // debugging
        // console.log('resultArray :', resultArray);
        return resultArray
    } catch (e) {
        console.log('pingLoop(), catch')
        console.error(e)
    }
}

var tcpLoop = async function (addresses, ports){
    // debugging
    // console.log(addresses)
    
    let resultArray = []
    try {
        for (i = 0; i < addresses.length; i++) {

            let copyPorts = ports.slice()
            const index = copyPorts.indexOf(addresses[i].portNumber)
            if(index !== -1){
                // console.log('index :', index)
                copyPorts.splice(index, 1)
                copyPorts.unshift(addresses[i].portNumber)
            }else{
                copyPorts.unshift(addresses[i].portNumber)
            }
            const set = new Set(copyPorts)
            const array = Array.from(set)
            // debugging
            // console.log(array)
            // debugging
            // console.log(`${addresses[i]._id}, ${addresses[i].address}, ${addresses[i].portNumber}`)

            for (x = 0; x < array.length; x++){
                // debugging
                console.log(`${x}, ${addresses[i].address}, ${array[x]}`)
                await doTcpCheck(addresses[i]).then((tcpResult) => {
                    const testResult = `${addresses[i]._id}:${addresses[i].address}:true`
                    resultArray.push(testResult)
                    // alive address
                    x = array.length

                }).catch(() => {
                    const testResult = `${addresses[i]._id}:${addresses[i].address}:false`
                    resultArray.push(testResult)
                })
            }

            
        }
        // debugging
        // console.log('resultArray :', resultArray);
        return resultArray
    } catch (e) {
        console.log('tcpLoop(), catch')
        console.error(e)
    }
}

module.exports = {
    doTcpCheck,
    doPingCheck,
    doDNSCheck, 
    pingLoop,
    tcpLoop
}