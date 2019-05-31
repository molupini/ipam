const { fetchAddresses } = require("./util/fetch")
const { doTcpCheck, doPingCheck } = require("./util/check")

// SCANNER FUNCTION
// note query will be parameter, and provided by the caller
const scanner = (endpoint, path, query, jwt, tcpPorts) => {
    // instance variables 
    var fullUrl = `${endpoint}${path}${query}`
    const patchPath = `${endpoint}${path}/`
    var ports = tcpPorts.split(',')

    // STARTING PROCESS 
    console.log({info:`Scanner Running, Interrogate IP Address Manager`, fullUrl})

    // FETCH FUNCTION
    // get addresses based on query 
    fetchAddresses(fullUrl, 'GET', jwt, (e, request) => {
        // debugging only
        // console.log(request)
        if (e) {
            console.error(e)
            return e
        }
        if(request === 'Please authenticate'){
            console.error('fetchAddresses','Please authenticate 1 Return')
            return 1
        }

        if(request === 'Not Found' || request === undefined){
            // debugging 
            console.log('fetchAddresses','Not Found 0 Return')
            return 0
        }
        if (request) {
            if(request.error){
                console.log(request)
                return request
            }
            // ITERATE RESULT
            request.forEach(element => {
                // instance variables 
                // debugging only
                // console.log('element :', element)
                const ip = element.address
                const portNumber = element.portNumber
                const id = element._id
                var isValid = []
                // ADD USER DEFINED PORT FIRST IN ARRAY
                let copyPorts = ports.slice()
                const index = copyPorts.indexOf(portNumber)
                if(index !== -1){
                    copyPorts.splice(index, 1)
                    copyPorts.unshift(portNumber)
                }else{
                    copyPorts.unshift(portNumber)
                }
                const set = new Set(copyPorts)
                ports = Array.from(set)
                // PING FUNCTION, START OF PROMISE CHAINING
                doPingCheck(ip)
                    .then((resultPing) => {
                        // debugging only
                        // console.log('doPingCheck resultPing :', resultPing)

                        // LOGIC 
                        // result from callback functions doPingCheck 
                        // resultPing response is true active mark entry isAvailable=false by next function within promise
                        if (!resultPing) {
                            // console.log('resultPing false', id, ip, resultPing)
                            return {
                                id,
                                ip,
                                resultPing
                            }
                        }

                        // LOGIC
                        // * resultPing response is false reverse condition and return to next promise 
                        // console.log('doPingCheck resultPing :', resultPing)
                        if(resultPing){
                            // console.log('resultPing true', id, ip, resultPing)
                            // FETCH FUNCTION
                            // patch ping result address is alive, undefined or true
                            // instance variable
                            const q = '?available=false'
                            fetchAddresses((patchPath + id + q), 'PATCH', jwt, (e, request) => {
                                // debugging only web request if output required
                                // console.log(request)
                                if (e) {
                                    return e
                                }
                            })
                            return {
                                id,
                                ip,
                                resultPing
                            }
                        }
                    }).then((returnResultPing) => {

                        // LOGIC
                        // reverse returnResultPing.resultPing based on return from above promise
                        // if true will return 0 within elseif 
                        if (!returnResultPing.resultPing === true) {
                            // debugging only
                            // console.log({ returnResultPing: { ...returnResultPing } })

                            // ITERATE RESULT
                            ports.forEach(port => {
                                
                                // TCP FUNCTION
                                // if successful return true and continue with then promise, see logic below
                                // if unsuccessful throw error and continue with catch promise 
                                doTcpCheck(parseInt(port), ip)
                                    .then((tcpResult) => {
                                   
                                        // LOGIC 
                                        if (tcpResult) {
                                            // TODO - verify ping blocked and common port open
                                            // debugging only, successful
                                            console.log('* doTcpCheck, tcp :', ip, port, tcpResult)
                                            // FETCH FUNCTION
                                            // patch check result address is alive
                                            // instance variable
                                            const q = '?available=false'
                                            fetchAddresses((patchPath + id + q), 'PATCH', jwt, (e, request) => {
                                                if (e) {
                                                    return e
                                                }
                                                // debugging only web request if output required
                                                // console.log(request)
                                            })
                                            // tcp port alive return to next promise 
                                            return 0 
                                        }

                                    })
                                    .catch((tcpError) => {
                                        // debugging only
                                        // console.log('doTcpCheck, tcpError :', tcpError)

                                        // error catch from function 'doTcpCheck' 
                                        // error string contains port checked verify port with port parameter from 'doTcpCheck' 
                                        // add to array 
                                        const inActive = parseInt(tcpError.message.split(':')[1]) === port
                                        isValid.push(inActive)
                                        // debugging 
                                        // timeout catch and added to array of identical port 
                                        // debugging only
                                        // const error = tcpError.message
                                        // console.log({
                                        //     tcpError: {
                                        //         id,
                                        //         error,
                                        //         inActive
                                        //     }
                                        // })
                                        // LOGIC  
                                        // length of unsuccessful ports equal to array
                                        if (isValid.length === ports.length) {

                                            // FETCH FUNCTION
                                            // fetch function, patch port(s) within array are all in-active, address is available
                                            // port check completed mark entry isAvailable=true
                                            // debugging only array below if output required
                                            // console.log(isValid)
                                            // instance variable
                                            var q = '?available=true'
                                            fetchAddresses((patchPath + id + q), 'PATCH', jwt, (e, request) => {
                                                if (e) {
                                                    return e
                                                }
                                                // debugging only
                                                // web request if output required
                                                // console.log(request)
                                            })
                                            return 0
                                        }
                                    })
                            })
                        }else if(returnResultPing.resultPing) {
                            // debugging
                            // console.log('returnResultPing unknown:',returnResultPing)
                            return 0
                        }
                    }).catch((error) => {
                        console.error(error)
                        throw new Error(error)
                    })
            })
        }
    })

}

module.exports = scanner
