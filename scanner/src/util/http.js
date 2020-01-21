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
            throw new Error('No Body')
        }
        return http
    } catch (e) {
        throw new Error(e)
    } 
}

var addressPatchLoop = async function (entries, baseUrl, path, queryStr, jwt){
    try {
        let resultArray = []
        for (i = 0; i < entries.length; i++) {
            var isAvailable = null
            // alive, 
            if(!entries[i].alive){
                isAvailable = 'true'
            }else{
                isAvailable = 'false'
            }

            const pathUpdate = `${path}/${entries[i].id}`
            const queryUpdate = `${queryStr}${isAvailable}`
            const httpResult = await httpFetch(baseUrl, pathUpdate, true, queryUpdate, 'PATCH', jwt)
            resultArray.push(httpResult.body)
        }
        return resultArray   
    } catch (e) {
        throw new Error(e)
    }
}

var httpSuccess = function(log, baseUrl, id, jwt){
    httpFetch(baseUrl, `/addresses/status/${id}`, true, `?available=false`, 'PATCH', jwt)
    .then((httpResult) => {
        if(!httpResult){
            return 1
        }
        if(log){
            // logger.log('info',`${moment()} httpResult.body`)
            // console.log(httpResult.body)
        }
        return 0 
    }).catch((httpError) => {
        throw new Error(httpError)
    })
}

var httpGateway = function(log, baseUrl, status, id, jwt){
    httpFetch(baseUrl, `/addresses/network/${id}/gateway`, true, `?available=${status}`, 'PATCH', jwt)
    .then((httpResult) => {
        if(!httpResult){
            return 1
        }
        if(log){
            // logger.log('info',`${moment()} httpResult.body`)
            // console.log(httpResult.body)
        }
        return 0 
    }).catch((httpError) => {
        throw new Error(httpError)
    })
}

var httpPointer = function(log, baseUrl, status, id, jwt){
    httpFetch(baseUrl, `/addresses/network/${id}/pointer`, true, `?available=${status}`, 'PATCH', jwt)
    .then((httpResult) => {
        if(!httpResult){
            return 1
        }
        if(log){
            // logger.log('info',`${moment()} httpResult.body`)
            // console.log(httpResult.body)
        }
        return 0 
    }).catch((httpError) => {
        throw new Error(httpError)
    })
}

var httpFailure = async function(log, baseUrl, id, jwt){
    await httpFetch(baseUrl, `/addresses/status/${id}`, true, `?available=true`, 'PATCH', jwt)
    .then((httpResult) => {
        if(!httpResult){
            return 1
        }
        if(log){
            // logger.log('info',`${moment()} httpResult.body`)
            // console.log(httpResult.body)
        }
        return 0 
    }).catch((httpError) => {
        throw new Error(httpError)
    })
}


module.exports = {
    httpFetch, 
    addressPatchLoop,
    httpSuccess,
    httpFailure, 
    httpGateway,
    httpPointer
}