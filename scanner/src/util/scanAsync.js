// CUSTOM MODULES
const { pingLoop, tcpLoop } = require("./network")
const { httpFetch, addressPatchLoop } = require("./http")


// SCAN 'ASYNC' FUNCTION 1-BY-1
var scanAsync = async function (baseUrl, path, query, jwt, ports){
    try {
        // FETCH FUNCTION
        const getAddresses = await httpFetch(baseUrl, path, true, query, 'GET', jwt)
        const body = getAddresses.body

        // PING FUNCTION 
        const resultPing = await pingLoop(body)
        // debugging
        // console.log({result: resultPing})
        
        // PATCH FUNCTION
        // UPDATE OF BOTH TRUE / FALSE ALIVE STATUS 
        const resultAddresses = await addressPatchLoop(resultPing, baseUrl, path, '?available=', jwt)
        // FILTER RETURN OF FALSE ALIVE STATUS, INVERSE OF BELOW 
        const after = resultAddresses.filter(post => post.isAvailable === true)
        // debugging
        // console.log(after)

        // TCP FUNCTION CHECK 
        const resultTcp = await tcpLoop(after, ports)
        // debugging
        // console.log(resultTcp)

        // UNION RESULT & PATCH ADDRESSES 
        const set = new Set(resultTcp)
        const array = [...set]
        // debugging
        // console.log(array)
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
        console.log({info:'--- Scanner Completed ---'})
        return 0
    } catch (e) {
        console.log('scan(), catch')
        console.error(e)
    }
}


module.exports = scanAsync