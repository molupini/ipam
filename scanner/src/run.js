// modules
const { httpFetch } = require('./util/http')
const scanAsync = require('./util/scanAsync')
const scanSync = require('./util/scanSync')
const moment = require('moment')

// env variables & instance variables
const baseUrl = process.env.EXPRESS_URL
const jwt = process.env.JWT_SCANNER
var delay = 1
var by = 60000
var loopCount = 0
var runCount = 0
// var finished = false


// MAIN FUNCTION
var run = async function (baseUrl, path, query, jwt, conf, runCount){
        try {
            var addresses = null
            var ports = null
            var init = false
            // debugging
            // console.log('conf :', conf);
            // STARTING
            console.log({info:`${runCount} : Scanner Running, Interrogate IP Address Manager`})

            // QUERY IF ANY INIT ADDRESSES
            addresses = await httpFetch(baseUrl, '/addresses/init?count=true', true, '', 'GET', jwt)
            // debugging
            // console.log(addresses.body)
            // console.log(addresses.body.message)

            // IF OBJECTS TO INITIATION, UPDATE QUERY STRING
            // ELSE IF WEEKDAY INTERVAL 'FULL SCAN' OMIT OWNER AND AVAILABLE, ADJUST QUERY STRING, SET EVENT FIRED TO TRUE
            // ELSE IF NEXT DAY, SET EVENT FIRED TO FALSE
            if(addresses.body.message > 0){
                // debugging
                console.log({info:`addresses to initialize, ${addresses.body.message}`})
                query = `/init?sort=updatedAt:acs`
                init = true
            } 
            if(!init && moment().isoWeekday() === conf.weekdayInterval && !conf.eventFired){
                // UPDATE QUERY
                query = `?sort=updatedAt:acs`
                // debugging
                await console.log({info:`full scan, weekdayInterval ${conf.weekdayInterval}, isoWeekday ${moment().isoWeekday()}`})
                // UPDATE EVENT FIRED TO TRUE
                await httpFetch(baseUrl, `/configs/schedules/event/${conf._id}`, true, '?event=true', 'PATCH', jwt)
            }
            if (!init && ((conf.weekdayInterval - moment().isoWeekday()) === -1 || (conf.weekdayInterval - moment().isoWeekday()) === 6) && conf.eventFired){
                // UPDATE EVENT FIRED TO FALSE
                // debugging
                console.log({info:`passed full scan, weekdayInterval ${conf.weekdayInterval}, isoWeekday ${moment().isoWeekday()}`})
                await httpFetch(baseUrl, `/configs/schedules/event/${conf._id}`, true, '?event=false', 'PATCH', jwt)
            }

            // ADD LIMIT TO QUERY STRING VARIABLE
            var query = `${query}&limit=${conf.limit}`
            console.log('* query :', query)
            // SPECIFY TCP PORTS 
            ports = conf.portList

            // SCAN FUNCTION 
            if(conf.scanSynchronous){
                console.log('* running : synchronously')
                await scanSync(baseUrl, path, query, jwt, ports)
            }
            else {
                console.log('* running : asynchronously')
                await scanAsync(baseUrl, path, query, jwt, ports)
            }
            return true
        } catch (e) {
            console.error(e)
            throw new Error(e)
            clearTimeout()
        }
}


// PROMISE TIMEOUT
// RUN / WHILE LOOP
const runLoop = async function () {
    var conf = null
    while (true) {

        try {
            // FETCH CONFIG
            conf = await httpFetch(baseUrl, '/configs/schedules?endpoint=address', true, '', 'GET', jwt)
            if(!conf.body){
                throw new Error('No Config')
            }
            // debugging 
            // console.log(conf.body)
            // SET DELAY
            delay = conf.body.minuteInterval
            console.log(`\nStarting runLoop`)
            console.log({info:`--- ${loopCount++} : delay : ${delay} minute(s), loading ---`})
            const now = await moment()
            await new Promise(resolve => setTimeout(resolve, delay*by)) 
            
            // RUN MAIN 
            await run(baseUrl, '/addresses', `?available=true&owner=null&sort=updatedAt:acs`, jwt, conf.body, (runCount++))
            
            // MEASURE TIME BETWEEN MOMENTS 
            const then = await moment()
            const thenNow = await then.diff(now, 'milliseconds')
            console.log(`moments in drift thenNow, ${thenNow}, delay configured ${(delay*by)}`)
            
            if (thenNow > delay*by){
                // await httpFetch(baseUrl, `/configs/schedules/progress/${conf.body._id}`, true, `?interval=${delay}`, 'PATCH', jwt)
                // console.log(`Interval being adjusted, suggest ${thenNow/(delay*by)}`)
            }

        } catch (e) {
            console.error(e)
            await new Promise(resolve => setTimeout(resolve, (delay*by)*2))
        }

    }
}
runLoop()


// NORMAL EXECUTION
// httpFetch(baseUrl, '/configs/schedules?endpoint=address', true, '', 'GET', jwt)
//     .then((conf) => {
//         if(!conf.body){
//             throw new Error('No Config')
//         }
//     // debugging
//     // console.log(conf.body)
//     run(baseUrl, '/addresses', `?available=true&owner=null&sort=updatedAt:acs`, jwt, conf.body, runCount++)
//     })
//     .catch((err) => {
//         console.error(err)
//     })

