const got = require('got')


// httpFetch function
var httpFetch = async function (baseUrl, path, json = true, queryStr = '', method = 'GET', jwt){
    const url = `${path}${queryStr}`
    // config client
    const client = got.extend({
        json,
        baseUrl,
        method,
        headers: {
            Authorization: `Bearer ${jwt}`
        }
    })

    try {
        // fetch addresses 
        var http = await client(url)
        if(!http.body){
            throw new Error('Unable to connect')
        }
        // debugging 
        // console.log(addresses)
        return http
    } catch (e) {
        throw new Error(e)
    } 
}

var addressPatchLoop = async function (entries, baseUrl, path, queryStr, jwt){
    // debugging
    // console.log(entries)
    try {
        let resultArray = []
        for (i = 0; i < entries.length; i++) {
            // debugging
            // console.log(`${entries[i].id}, ${entries[i].host},  ${entries[i].alive}`)
    
            var isAvailable = null
            // alive, 
            if(!entries[i].alive){
                isAvailable = 'true'
            }else{
                isAvailable = 'false'
            }

            const pathUpdate = `${path}/${entries[i].id}`
            const queryUpdate = `${queryStr}${isAvailable}`
            // debugging
            // console.log(baseUrl, pathUpdate, queryUpdate)
            const httpResult = await httpFetch(baseUrl, pathUpdate, true, queryUpdate, 'PATCH', jwt)
            resultArray.push(httpResult.body)
        }
        // debugging
        // console.log('resultArray :', resultArray);
        return resultArray   
    } catch (e) {
        console.error(e)
    }
}


module.exports = {
    httpFetch, 
    addressPatchLoop
}