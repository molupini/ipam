// CUSTOM MODULES
const { pingLoop, tcpLoop } = require('./network')
const { httpFetch, addressPatchLoop } = require('./http')
const { logger } = require('../util/log')
const moment = require('moment')


// SCAN 'ASYNC' FUNCTION 1-BY-1
var scanAsync = async function (baseUrl, path, query, jwt, ports){
    try {
        // FETCH FUNCTION
        const getAddresses = await httpFetch(baseUrl, path, true, query, 'GET', jwt)
        const body = getAddresses.body

        // PING FUNCTION 
        const resultPing = await pingLoop(body)
        
        // PATCH FUNCTION
        // UPDATE OF BOTH TRUE / FALSE ALIVE STATUS 
        const resultAddresses = await addressPatchLoop(resultPing, baseUrl, path, '?available=', jwt)
        // FILTER RETURN OF FALSE ALIVE STATUS, INVERSE OF BELOW 
        const after = resultAddresses.filter(post => post.isAvailable === true)

        // TCP FUNCTION CHECK 
        const resultTcp = await tcpLoop(after, ports)

        // UNION RESULT & PATCH ADDRESSES 
        const set = new Set(resultTcp)
        const array = [...set]
        const objects = []
        await array.forEach(element => {
            const object = {
                id: element.split(':')[0],
                host: element.split(':')[1],
                alive: element.split(':')[2] === 'true'
            }
            objects.push(object)
        })
        if(objects.length > 0){
            const resultAddresses = await addressPatchLoop(objects, baseUrl, path, '?available=', jwt)
        }
        // COMPLETED
        // logger.log('info',`${moment()} scanSync completed`)
        return 0
    } catch (e) {
        throw new Error(e)
    }
}


module.exports = scanAsync