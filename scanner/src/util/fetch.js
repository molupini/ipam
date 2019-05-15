const request = require("request")

var fetchAddresses = (url, method, token, callback) => {
    request(url, {
        method: method,
        json: true,
        auth: {
            bearer: token
        }
    }, (error, response) => {
            if (error) {
                callback({ error: error })
            } else {
                callback(undefined, response.body)
            }
    })
}

module.exports = {
    fetchAddresses
}