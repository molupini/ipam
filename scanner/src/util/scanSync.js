// CUSTOM MODULES
const { doPingCheck, doTcpCheck } = require("./network")
const { httpFetch, httpFailure, httpSuccess } = require("./http")


// SCAN 'SYNC' FUNCTION
var scanSync = async function (baseUrl, path, query, jwt, ports){
    try {
        // FETCH FUNCTION
        // debugging
        console.log(`httpFetch : ${baseUrl}${path}${query}`)
        const    getAddresses = await httpFetch(baseUrl, path, true, query, 'GET', jwt)
        const body = getAddresses.body
        // debugging 
        console.log('httpFetch body:', getAddresses.statusCode);
        
        // NETWORK LOOP
        var networkLoop = async function (addresses){
            // debugging
            // console.log(addresses)
            for (i = 0; i < addresses.length; i++) {
                // debugging
                console.log(`${addresses[i]._id}, ${addresses[i].address}, ping`)

                // PING FUNCTION 
                doPingCheck(addresses[i])
                .then((result) => {
                    // debugging 
                    // console.log('doPingCheck result :', result)
                    if(result.alive){
                        httpSuccess(false, baseUrl, result.id, jwt)
                        // debugging
                        // console.log('doPingCheck httpSuccess')
                        return 0
                    }
                    if(!result.alive){
                        // UNION PORTS WITH SUGGESTED 
                        let copyPorts = ports.slice()
                        const index = copyPorts.indexOf(result.port)
                        if(index !== -1){
                            // console.log('index :', index)
                            copyPorts.splice(index, 1)
                            copyPorts.unshift(result.port)
                        }else{
                            copyPorts.unshift(result.port)
                        }
                        const set = new Set(copyPorts)
                        const array = Array.from(set)
                        // debugging
                        // console.log(array)
                        var isValid = []
                        for (x = 0; x < array.length; x++){
                            // debugging 
                            console.log(`${x}, ${result.host}, ${array[x]}`)
                            // TCP FUNCTION CHECK 
                            doTcpCheck(result.host, array[x]).then((tcpResult) => {
                                // debugging
                                // console.log('doTcpCheck tcpResult :', tcpResult)
                                if(tcpResult){
                                    httpSuccess(true, baseUrl, result.id, jwt)
                                    // debugging
                                    // console.log('doTcpCheck httpSuccess')
                                    return 0
                                }
                            }).catch((tcpError)=> {
                                // debugging
                                // console.log('doTcpCheck tcpError :', tcpError.message)
                                const inActive = tcpError.message.split(':')[2]
                                // console.log('inActive :', inActive)
                                isValid.push(inActive)
                                if (isValid.length === array.length) {
                                    // console.log('isValid :', isValid)
                                    httpFailure(false, baseUrl, result.id, jwt)
                                    // debugging
                                    // console.log('doTcpCheck httpFailure')
                                    return 0
                                }
                            })
                        }
                    }
                }).catch((error) => {
                    // debugging 
                    throw new Error(error)
                })
            }
        }

        networkLoop(body)

    } catch (e) {
        console.log('scan(), catch')
        console.error(e)
    }
}


module.exports = scanSync