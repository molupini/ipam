// CUSTOM MODULES
const { pingLoop, tcpLoop } = require("./network")
const { httpFetch, addressPatchLoop } = require("./http")


// SCAN 'ASYNC' FUNCTION 1-BY-1
var scanAsync = async function (baseUrl, path, query, jwt, ports){
    try {
        // FETCH FUNCTION
        // debugging
        // console.log(`httpFetch : ${baseUrl}${path}${query}`)
        const getAddresses = await httpFetch(baseUrl, path, true, query, 'GET', jwt)
        const body = getAddresses.body
        // debugging 
        // console.log('httpFetch body statusCode:', getAddresses.statusCode)
        
        // not required for scanAsync
        //    if(getAddresses.statusCode === 201 || getAddresses.statusCode === 200){
        //         // LOCK SCHEDULE 
        //         // UPDATE EVENT FIRED TO TRUE
        //         await httpFetch(baseUrl, `/configs/schedules/progress/${schedule}`, true, '?lock=true', 'PATCH', jwt)
        //    }

        // PING FUNCTION 
        const resultPing = await pingLoop(body)
        // debugging
        // console.log({result: resultPing})
        
        // PATCH FUNCTION
        const resultAddresses = await addressPatchLoop(resultPing, baseUrl, path, '?available=', jwt)
        const after = resultAddresses.filter(post => post.isAvailable === true)
        // debugging
        // console.log(after)

        // TCP FUNCTION CHECK 
        const resultTcp = await tcpLoop(after, ports)
        // debugging
        // console.log(resultTcp)
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
            // PATCH ADDRESSES, FINAL CHECK UNTIL DNS TESTING
            // debugging
            // console.log(objects)
            await addressPatchLoop(objects, baseUrl, path, '?available=', jwt)
        }
        // not required for scanAsync
        // UNLOCK SCHEDULE
        // await httpFetch(baseUrl, `/configs/schedules/progress/${schedule}`, true, '?lock=false', 'PATCH', jwt)

        // COMPLETED
        console.log({info:'>>> Scanner Completed <<<'})
    } catch (e) {
        console.log('scan(), catch')
        console.error(e)
    }
}


module.exports = scanAsync