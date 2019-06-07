// modules
const { httpFetch } = require('./util/http')
const scanAsync = require('./util/scanAsync')
const scanSync = require('./util/scanSync')
const moment = require('moment')

// env variables & instance variables
const baseUrl = process.env.EXPRESS_URL
const jwt = process.env.JWT_SCANNER
var delay = 1
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
                // ISSUES COMPLETING ALL FUNCTION 
                await scanSync(baseUrl, path, query, jwt, ports)
            }
            else {
                await scanAsync(baseUrl, path, query, jwt, ports)
            }
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
            conf = await httpFetch(baseUrl, '/configs/schedules?endpoint=address', true, '', 'GET', jwt)
                            .then((conf) => {
                            if(!conf.body){
                                throw new Error('No Config')
                            }
                            // debugging
                            // console.log(conf.body)
                            return conf.body
                            })
                            // .then((result0) => {
                                
                            // })
                            .catch((err) => {
                                throw new Error(err)
                            })
            delay = conf.minuteInterval
            console.log(`\nStarting runLoop`)
            console.log({info:`--- ${loopCount} : delay : ${delay} minute(s), loading ---`})
            await new Promise(resolve => setTimeout(resolve, delay*60000)) 
            // not required for scanAsync, can be used to adjust delay more accurately based on moment start and finished
            // if (conf.scanInProgress){
            //     await httpFetch(baseUrl, `/configs/schedules/progress/${conf._id}`, true, `?interval=${delay}`, 'PATCH', jwt)
            //     throw new Error('Interval being adjusted')
            // }
            if(loopCount++ === runCount){
                await run(baseUrl, '/addresses', `?available=true&owner=null&sort=updatedAt:acs`, jwt, conf, (runCount++))
            }else if (loopCount > runCount){
                // TODO 
                // increase minute interval
                // decrease loopCount
            }
            console.log('loopCount :', loopCount)
            console.log('runCount :', runCount)
        } catch (e) {
            console.error(e)
            await new Promise(resolve => setTimeout(resolve, (delay*60000)*2))
        }

    }
}
runLoop()


// TIMERS FUNCTION
// ISSUE: TIMER IS NON BLOCKING, OUTER TIMER WILL NOT WAIT
// Nested setTimeout calls is a more flexible alternative to setInterval
// see https://javascript.info/settimeout-setinterval#setinterval
// note 1 min to ms 60000 ms 
// let timeId = setTimeout(async function configTimer() {
//     // debugging
//     console.log(`\n* * * ${countTimer++} : timer : ${timer/60000} minutes  * * *\n`)
//     const conf = await httpFetch(baseUrl, '/configs/schedules?endpoint=address', true, '', 'GET', jwt)
//     .then((conf) => {
//         if(conf.body){
//             // MINUTE INTERVAL ADJUST TIMER OF DELAY, FREQUENCY OF SCAN 
//             timer = conf.body.minuteInterval*60000
//             timeId = setTimeout(configTimer, timer)
//             // debugging
//             // console.log({
//             //     timer: timer, 
//             //     timeId: timeId
//             // })
//             return conf
//         }
//     })
//     .catch((err) => {
//         console.error(err)
//     })
//     configuration = conf.body
//     // debugging
//     // console.log(timeId, configuration, timer)
//     // await setTimeout(run, timer, baseUrl, '/addresses', `?available=true&owner=null&sort=updatedAt:acs`, jwt, configuration, timer)
// }, timer)


// NORMAL EXECUTION
// httpFetch(baseUrl, '/configs/schedules?endpoint=address', true, '', 'GET', jwt)
//     .then((conf) => {
//         if(!conf.body){
//             throw new Error('No Config')
//         }
//     // debugging
//     // console.log(conf.body)
//     run(baseUrl, '/addresses', `?available=true&owner=null&sort=updatedAt:acs`, jwt, conf.body, runCount)
//     })
//     .catch((err) => {
//         console.error(err)
//     })

