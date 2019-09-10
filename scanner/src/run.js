// modules
const { httpFetch } = require('./util/http')
const scanAsync = require('./util/scanAsync')
const scanSync = require('./util/scanSync')
const moment = require('moment')
const { logger } = require('../src/util/log')

// env variables & instance variables
const baseUrl = process.env.EXPRESS_URL
const jwt = process.env.JWT_SCANNER
const networkAddress = process.env.NETWORK_ADDRESS

var delay = 1
var by = 60000
var loopCount = 0


// MAIN FUNCTION
var run = async function (baseUrl, path, query, jwt, conf){
        try {
            var addresses = null
            var ports = null
            var init = false
            // STARTING
            // await logger.log('info', `${moment()} mode scanSynchronous=${conf.scanSynchronous}`)
            // QUERY IF ANY INIT ADDRESSES
            addresses = await httpFetch(baseUrl, '/addresses/init?count=true', true, '', 'GET', jwt)

            // IF OBJECTS TO INITIATION, UPDATE QUERY STRING
            // ELSE IF WEEKDAY INTERVAL 'FULL SCAN' OMIT OWNER AND AVAILABLE, ADJUST QUERY STRING, SET EVENT FIRED TO TRUE
            // ELSE IF NEXT DAY, SET EVENT FIRED TO FALSE
            if(addresses.body.message > 0){
                // await logger.log('info', `${moment()} --- init count, ${addresses.body.message} ---`)
                query = `/init?sort=updatedAt:acs`
                init = true
            } 
            if(!init && moment().isoWeekday() === conf.weekdayInterval && !conf.eventFired){
                // UPDATE QUERY
                // query = `?sort=updatedAt:acs`
                await logger.log('info', `${moment()} --- full scan, weekday interval ---`)
                // UPDATE EVENT FIRED TO TRUE
                await httpFetch(baseUrl, `/configs/schedules/event/${conf._id}`, true, '?event=true', 'PATCH', jwt)
            }
            if (!init && ((conf.weekdayInterval - moment().isoWeekday()) === -1) && conf.eventFired){
                // UPDATE EVENT FIRED TO FALSE
                await logger.log('info', `${moment()} --- passed full scan interval ---`)
                await httpFetch(baseUrl, `/configs/schedules/event/${conf._id}`, true, '?event=false', 'PATCH', jwt)
            }

            // ADD LIMIT TO QUERY STRING VARIABLE
            var query = `${query}&limit=${conf.limit}&maxFp=${conf.maxTrueCount}`
            await logger.log('info',`${moment()} --- query ${query} ---`)
            // SPECIFY TCP PORTS 
            ports = conf.portList

            // SCAN FUNCTION 
            if(conf.scanSynchronous){
                await scanSync(baseUrl, path, query, jwt, ports)
            }
            else {
                await scanAsync(baseUrl, path, query, jwt, ports)
            }
            return true
        } catch (e) {
            throw new Error(e)
            clearTimeout()
        }
}


// PROMISE TIMEOUT
// RUN / WHILE LOOP
const runLoop = async function () {
    var conf = null
    var query = '?available=true&owner=null&sort=updatedAt:acs'
    
    while (true) {

        try {
            // NETWORK PARAMETER
            if (networkAddress !== 'all'){
                query = `?network=${networkAddress}&available=true&owner=null&sort=updatedAt:acs`
            }
            // FETCH CONFIG
            conf = await httpFetch(baseUrl, '/configs/schedules?endpoint=address', true, '', 'GET', jwt)
            if(!conf.body){
                throw new Error('No Config')
            }
            // SET DELAY
            delay = conf.body.minuteInterval
            loopCount++
            logger.log('info', `${moment()} --- runLoop delay ${delay} minute(s) ---`)
            const now = await moment()
            await new Promise(resolve => setTimeout(resolve, delay*by)) 
            
            // RUN MAIN 
            // CONDITION BELOW, TARGET ADDRESSES BASED ON ENV VARIABLE
            await run(baseUrl, '/addresses', query, jwt, conf.body)
            
            // MEASURE TIME BETWEEN MOMENTS 
            const then = await moment()
            const thenNow = await then.diff(now, 'milliseconds')
            // logger.log('info',`${moment()} drift, ${thenNow}, delay ${(delay*by)}`)
            if (thenNow > delay*by){
                // await httpFetch(baseUrl, `/configs/schedules/progress/${conf.body._id}`, true, `?interval=${delay}`, 'PATCH', jwt)
                // logger.log('info',`${moment()} adjusted, ${thenNow/(delay*by)}`)
            }
        } catch (e) {
            const errorStr = String(e)
            if(errorStr.match(/(HTTPError)/)){
                logger.log('error',`${moment()} ${errorStr}`)
            }else{
                logger.log('error',`${moment()} ${e}`)
            }
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
//     run(baseUrl, '/addresses/status', `?available=true&owner=null&sort=updatedAt:acs`, jwt, conf.body)
//     })
//     .catch((err) => {
//     })

