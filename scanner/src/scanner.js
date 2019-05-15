const { fetchAddresses } = require("./util/fetch")
const { doTcpCheck, doPingCheck } = require("./util/check")
const chalk = require('chalk')

const scanner = (endpoint, port, jwt, options, tcpcheckports) => {
    var urlAddresses = null
    if (options) {
        urlAddresses = `${endpoint}:${port}/addresses?${options}&sort=updatedAt:acs`
    } else {
        urlAddresses = `${endpoint}:${port}/addresses?sort=updatedAt:acs`
    }
    const urlAddress = `${endpoint}:${port}/addresses/`
    const ports = tcpcheckports.split(',')

    // debuging only
    console.log({
        urlAddresses,
        ports
    })

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
                doPingCheck(ip)
                    .then((r0) => {
                        // result from callback functions doPingCheck 
                        // r0 response is true active mark entry isAvailable=false
                        // debuging only
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
                        console.log(chalk.yellow(`r0: ${ip}, ${q}`))
                        fetchAddresses((urlAddress + id + q), 'PATCH', jwt, (e, request) => {
                            if (e) {
                                return e
                            }
                            // debuging only web request if output required
                            // console.log(request)
                        })
                    }).then((r1) => {
                        if (!r1.r0) {
                            // debuging only
                            // console.log({ r1: { ...r1 } })
                            ports.forEach(port => {
                                doTcpCheck(port, ip)
                                    .then((tcp) => {
                                        if (tcp) {
                                            // TODO need to confirm testing of blocked icmp and open a port out of the checklist 
                                            const q = '?available=false'
                                            console.log(chalk.blue(`r1: ${q}, ${ip}, ${tcp}`))
                                            fetchAddresses((urlAddress + id + q), 'PATCH', jwt, (e, request) => {
                                                if (e) {
                                                    return e
                                                }
                                                // debuging only web request if output required
                                                // console.log(request)
                                            })
                                        }
                                    })
                                    .catch((e1) => {
                                        const inActive = parseInt(e1.message.split(':')[1]) === port
                                        isValid.push(inActive)
                                        // timeout catch and added to array of identical port 
                                        // const error = e1.message
                                        // debuging only
                                        // console.log({
                                        //     e1: {
                                        //         id,
                                        //         error,
                                        //         inActive
                                        //     }
                                        // })

                                        if (isValid.length === ports.length) {
                                            // port check completed mark entry isAvailable=true
                                            // debuging only array below if output required
                                            // console.log(isValid)
                                            // TODO -- verify if owner is not null that if trueCount is higher then example 1440 (checks per hour x days) update address with null owner. 
                                            // TODO -- before updating above require a notification to owner
                                            var q = '?available=true'
                                            if (owner !== null && trueCount > 1440) {
                                                q = q + `&owner=${owner}`
                                                console.log(chalk.blue(`e1: ${ip}, ${q}`))
                                            } else {
                                                console.log(chalk.magenta(`e1: ${ip}, ${q}`))
                                            }
                                            fetchAddresses((urlAddress + id + q), 'PATCH', jwt, (e, request) => {
                                                if (e) {
                                                    return e
                                                }
                                                // debuging only
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
