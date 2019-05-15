const scanner = require('./scanner')
const CronJob = require('cron').CronJob

var count = 0 
new CronJob('1 * * * * *', function() {
    count++
    console.log('cron count: ', count)
    const options = false
    scanner(process.env.ENDPOINT, process.env.PORT, process.env.JWT, options, process.env.TCP_CHECK_PORTS)
}, null, true)