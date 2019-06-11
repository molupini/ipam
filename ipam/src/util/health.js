const http = require('http')

const options = {
    host: '0.0.0.0',
    port: process.env.PORT,
    path: '/healthv',
    timeout: 2000
}

const check = http.request(options, (res) => {
    if(res.statusCode == 200){
        process.exit(0)
    }else{
        process.exit(1)
    }
})

check.on('error', function (e) {
    process.exit(1)
})

check.end()
