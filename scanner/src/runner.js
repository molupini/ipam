const scanner = require('./util/scanner')

// TODO logging feature verbose =true/false
// TODO within scanner if possible reduce complexity 
// TODO CRON Job of this process or While loop
// TODO test failures
// TODO DNS PTR Lookup in scanner

// fullScan below will reduce the fetch size from the addresses endpoint based on day of the month 
// False only check
// check addresses in use only
// activity - first init only
// if run after init will only verify actual live addresses and not false positives
// var fullScan = null

// True only check
// check free addresses with no owner
// activity - hourly
// var fullScan = true

// True / False check / Existing owner
// activity - daily, provide status of false positives, aka see address.trueCount
const fullScan = false

var query = ''
if (fullScan) {
    query = `?available=true&owner=null&sort=updatedAt:acs`
} 
else if (!fullScan) {
    // TODO - if any addresses to init will bypass query
    query = `?sort=updatedAt:acs&limit=50` // if limit excluded default will apply in endpoint
    // urlAddresses = `${endpoint}/addresses/init`
}else{
    query = `/init`
}

scanner(process.env.EXPRESS_URL, '/addresses', query, process.env.JWT_SCANNER, process.env.TCP_PORT_ARRAY)