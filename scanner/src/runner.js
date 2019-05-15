const scanner = require('./scanner')

// TODO logging feature verbose =true/false
// TODO need to modularize code within scanner if possible or see if can reduce complexity 
// TODO CRON Job of this process or While loop
// TODO test failures
// TODO DNS PTR Lookup in scanner

// options below will reduce the fetch size from the addresses endpoint based on day of the month 
// False only check
// check addresses in use
// activity - rarely used 
// const options = `available=false`

// True only check
// check free addresses with no owner
// activity - hourly
// const options = `available=true&owner=null`

// True / False check / Existing owner
// activity - 30 days, need to evaluate   
const options = false

// True / False check / Null owner
// activity - 14 days 
// check free addresses and used address with owner null
// const options = `owner=null`

scanner(process.env.ENDPOINT, process.env.PORT, process.env.JWT, options, process.env.TCP_CHECK_PORTS)

// testing while loop - not successful 
// var run = async function(count) {
//     console.log(`executing scanner: ${count}`)
//     await scanner(process.env.ENDPOINT, process.env.PORT, process.env.JWT, options, process.env.TCP_CHECK_PORTS)
//     setTimeout(run, 5000)
// }

// var count = 0
// while (true) {
//     if (count >= 10) {
//         break
//     }
//     count++
//     run(count).then((r) => {
//         console.log(r)
//     }).catch((e) => {
//         console.log(e)
//     })
// }
