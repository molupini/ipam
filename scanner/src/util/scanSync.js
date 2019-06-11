// CUSTOM MODULES
const { doPingCheck, doTcpCheck } = require("./network")
const { httpFetch, httpFailure, httpSuccess } = require("./http")
const { logger } = require('../util/log')
const moment = require('moment')

// SCAN 'SYNC' FUNCTION
var scanSync = async function (baseUrl, path, query, jwt, ports){
    try {
        // FETCH FUNCTION
        const getAddresses = await httpFetch(baseUrl, path, true, query, 'GET', jwt)
        const body = getAddresses.body

        // NETWORK LOOP
        var networkLoop = async function (addresses){
            for (i = 0; i < addresses.length; i++) {

                // PING FUNCTION 
                doPingCheck(addresses[i])
                .then((result) => {
                    if(result.alive){
                        // debugging 
                        logger.log('info',`${moment()} doPingCheck ${result.id} ${result.host} ${result.alive}`)
                        httpSuccess(false, baseUrl, result.id, jwt)
                        return 0
                    }
                    if(!result.alive){
                        // UNION PORTS WITH SUGGESTED 
                        let copyPorts = ports.slice()
                        const index = copyPorts.indexOf(result.port)
                        if(index !== -1){
                            copyPorts.splice(index, 1)
                            copyPorts.unshift(result.port)
                        }else{
                            copyPorts.unshift(result.port)
                        }
                        const set = new Set(copyPorts)
                        const array = Array.from(set)
                        var isValid = []
                        for (x = 0; x < array.length; x++){
                            // TCP FUNCTION CHECK 
                            doTcpCheck(result.host, array[x]).then((tcpResult) => {
                                // debugging
                                logger.log('info',`${moment()} doTcpCheck.tcpResult ${result.id} ${result.host} ${array[x]} ${tcpResult}`)
                                if(tcpResult){
                                    httpSuccess(true, baseUrl, result.id, jwt)
                                    return 0
                                }
                            }).catch((tcpError)=> {
                                // debugging
                                // logger.log('info',`${moment()} doTcpCheck.tcpError ${tcpError}`)
                                const inActive = tcpError.message.split(':')[2]
                                const ip = result.host
                                isValid.push({ip, inActive})
                                if (isValid.length === array.length) {
                                    // console.log(isValid)
                                    logger.log('info',`${moment()} doTcpCheck.tcpError ${ip}`)
                                    httpFailure(false, baseUrl, result.id, jwt)
                                }
                            })
                        }
                    }
                }).catch((error) => {
                    // debugging 
                    throw new Error(error)
                })
            }
            // COMPLETED
            // logger.log('info',`${moment()} scanSync completed`)
        }
        // IMPORTANT TO AWAIT FOR LOOP TO FINISH
        await networkLoop(body)
    } catch (e) {
        throw new Error(e)
    }
}


module.exports = scanSync