const { fetchAddresses } = require("./util/fetch")
const { doTcpCheck, doPingCheck } = require("./util/check")
const chalk = require('chalk')

// scanner function
const scanner = (endpoint, jwt, options, tcpPorts) => {
    var urlAddresses = null
    
    if (options) {
        urlAddresses = `${endpoint}/addresses?${options}&sort=updatedAt:acs`
    } else {
        urlAddresses = `${endpoint}/addresses?sort=updatedAt:acs`
    }
    
    const urlAddress = `${endpoint}/addresses/`
    const ports = tcpPorts.split(',')

    // debugging only
    console.log({info:'Scanner Running, Interrogate IP Address Manager'})
    // console.log({
    //     urlAddresses,
    //     ports
    // })

    // fetch function, get full scope 
    fetchAddresses(urlAddresses, 'GET', jwt, (e, request) => {
        if (e) {
            console.log(e)
            return e
        }

        if (request.error) {
            console.log({
                error: request.error
            })
            return request.error
        } else {
            request.forEach(element => {

                const ip = element.address
                const id = element._id
                const owner = element.owner
                const trueCount = element.trueCount
                
                var isValid = []
                // check function
                doPingCheck(ip)
                    .then((r0) => {
                        // result from callback functions doPingCheck 
                        // r0 response is true active mark entry isAvailable=false
                        // debugging only
                        // console.log({ r0: { id, ip, r0 } })
                        if (!r0) {
                            return {
                                id,
                                ip,
                                owner,
                                trueCount,
                                r0
                            }
                        }
                        const q = '?available=false'
                        // debugging
                        // console.log(chalk.yellow(`r0: ${ip}, ${q}`))
                        // fetch function, patch can ping address
                        fetchAddresses((urlAddress + id + q), 'PATCH', jwt, (e, request) => {
                            if (e) {
                                return e
                            }
                            // debugging only web request if output required
                            // console.log(request)
                        })
                    }).then((r1) => {
                        if (!r1.r0) {
                            // debugging only
                            // console.log({ r1: { ...r1 } })
                            ports.forEach(port => {
                                // check function
                                doTcpCheck(port, ip)
                                    .then((tcp) => {
                                        if (tcp) {
                                            // TODO need to confirm testing of blocked ping and open a port out of the checklist 
                                            const q = '?available=false'
                                            // console.log(chalk.blue(`r1: ${q}, ${ip}, ${tcp}`))
                                            // fetch function, patch port is active
                                            fetchAddresses((urlAddress + id + q), 'PATCH', jwt, (e, request) => {
                                                if (e) {
                                                    return e
                                                }
                                                // debugging only web request if output required
                                                // console.log(request)
                                            })
                                        }
                                    })
                                    .catch((e1) => {
                                        const inActive = parseInt(e1.message.split(':')[1]) === port
                                        isValid.push(inActive)
                                        // timeout catch and added to array of identical port 
                                        // const error = e1.message
                                        // debugging only
                                        // console.log({
                                        //     e1: {
                                        //         id,
                                        //         error,
                                        //         inActive
                                        //     }
                                        // })
                                        if (isValid.length === ports.length) {
                                            // port check completed mark entry isAvailable=true
                                            // debugging only array below if output required
                                            // console.log(isValid)
                                            var q = '?available=true'
                                            // fetch function, patch port(s) within array are all in-active, address is available
                                            fetchAddresses((urlAddress + id + q), 'PATCH', jwt, (e, request) => {
                                                if (e) {
                                                    return e
                                                }
                                                // debugging only
                                                // web request if output required
                                                // console.log(request)
                                            })
                                        }
                                    })
                            })
                        }
                    }).catch((e0) => {
                        if (e0.message !== `Cannot read property 'r0' of undefined`) {
                            const error = e0.message
                            console.log(chalk.red(
                                id,
                                error
                            ))
                        }
                    })
            })
        }
    })

}

module.exports = scanner
