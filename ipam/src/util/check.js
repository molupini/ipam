// source code from scanner/src/util/check.js
const ping = require('ping')
const logger = require('../util/log')

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

module.exports = {
    doPingCheck
}