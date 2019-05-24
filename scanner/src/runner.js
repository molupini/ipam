const scanner = require('./scanner')

// TODO logging feature verbose =true/false
// TODO within scanner if possible reduce complexity 
// TODO CRON Job of this process or While loop
// TODO test failures
// TODO DNS PTR Lookup in scanner

// Options below will reduce the fetch size from the addresses endpoint based on day of the month 
// False only check
// check addresses in use only
// activity - first init only
// if run after init will only verify actual live addresses and not false positives
// const options = `available=false`

// True only check
// check free addresses with no owner
// activity - hourly
// const options = `available=true&owner=null`

// True / False check / Existing owner
// activity - daily, provide status of false positives, aka see address.trueCount
const options = false

scanner(process.env.EXPRESS_URL, process.env.JWT_SCANNER, options, process.env.TCP_PORT_ARRAY)