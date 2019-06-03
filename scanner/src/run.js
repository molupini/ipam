// modules
// const CronJob = require('cron').CronJob
// custom modules
const { httpFetch } = require('./util/http')
const scanAsync = require('./util/scanAsync')
const scanSync = require('./util/scanSync')

// env variables 
const urlAddress = process.env.EXPRESS_URL
const jwt = process.env.JWT_SCANNER

// TEST BOTH CRON AND WHILE LOOP
// function cron (pattern = '* * * * * *', baseUrl, path, query){
//     var count = 0
//     new CronJob(pattern, function(){
//         count++
//         console.log(`cron ${pattern} count: ${count}`)
//         console.log(`${baseUrl}${path}${query}`)
//     }, null, true)
// }

// MAIN FUNCTION
async function run(baseUrl, path, query, jwt){
    // while (true) {
        try {
            // STARTING
            console.log({info:'Scanner Running, Interrogate IP Address Manager'})

            // FETCH SCHEDULE 
            const config = await httpFetch(baseUrl, '/configs/schedules?endpoint=address', true, '', 'GET', jwt)
            // QUERY IF ANY INIT ADDRESSES
            const addresses = await httpFetch(baseUrl, '/addresses/init?count=true', true, '', 'GET', jwt)
            if(!config){
                return 1
            }
            // debugging
            console.log(config.body)
            console.log(addresses.body)
            console.log(addresses.body.message)
    
            // OBJECTS TO INITIATION, UPDATE QUERY STRING
            if(addresses.body.message > 0){
                query = `/init?sort=updatedAt:acs`
            }
            // QUERY STRING VARIABLE UPDATED WITH LIMIT
            var query = `${query}&limit=${config.body.scanLimit}`
            const ports = config.body.portList

            // SCAN FUNCTION 
            if(config.body.scannerSync){
                scanSync(baseUrl, path, query, jwt, ports)
            }
            else {
                scanAsync(baseUrl, path, query, jwt, ports)
            }

            
    
            // httpSchedule.body.cronScheduleDelta
            // cron('* * * * * *', baseUrl, path, delta)
            
            // httpSchedule.body.cronScheduleFull
            // cron(httpSchedule.body.cronScheduleFull, baseUrl, false)
            
        } catch (e) {
            console.error(e)
        }
    
    // }
}

run(urlAddress, '/addresses', `?available=true&owner=null&sort=updatedAt:acs`, jwt)


