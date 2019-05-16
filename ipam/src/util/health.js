const http = require('http')

const options = {
    host: '0.0.0.0',
    port: 3000,
    path: '/healthv',
    timeout: 2000
}

const check = http.request(options, (res) => {
    console.log(`healthcheck status: ${res.statusCode}`)
    if(res.statusCode == 200){
        process.exit(0)
    }else{
        process.exit(1)
    }
})

check.on('error', function (e) {
    console.error('ERROR')
    process.exit(1)
})

check.end()
