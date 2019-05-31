// source code from scanner/src/util/check.js
const ping = require('ping') 

var doPingCheck = async function (ip) {
    try {
        const pong = await ping.promise.probe(ip)
        const test = pong.alive
        if (test) {
            return test === true
        } else {
            return test
        }
    } catch (e) {
        throw new Error(e)
    }
}

var pingLoop = async function (addresses){
    // debugging
    // console.log(addresses.length)
    let resultArray = []
    for (i = 0; i < addresses.length; i++) {
        // debugging
        // console.log(`${address[i]._id}, ${addresses[i].address}, ping`)
        await doPingCheck(addresses[i]).then((pingResult) => {
            // console.log('doPingCheck :', pingResult);
            resultArray.push(pingResult)
        })
    }
    // debugging
    // console.log('resultArray :', resultArray);
    return resultArray
}

module.exports = {
    doPingCheck, 
    pingLoop
}