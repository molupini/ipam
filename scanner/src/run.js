// modules
const cron = require('cron')
// custom modules
const { httpFetch } = require('./util/http')
const scanAsync = require('./util/scanAsync')
const scanSync = require('./util/scanSync')
const moment = require('moment')

// env variables 
const baseUrl = process.env.EXPRESS_URL
const jwt = process.env.JWT_SCANNER
var timer = 1


// MAIN FUNCTION
var run = async function (baseUrl, path, query, jwt, conf){
    var fullScan = null
    var addresses = null
    var ports = null
        try {
            // STARTING
            console.log({info:'Scanner Running, Interrogate IP Address Manager'})

            // QUERY IF ANY INIT ADDRESSES
            addresses = await httpFetch(baseUrl, '/addresses/init?count=true', true, '', 'GET', jwt)
            // debugging
            // console.log(addresses.body)
            // console.log(addresses.body.message)

            // IF OBJECTS TO INITIATION, UPDATE QUERY STRING
            // ELSE IF WEEKDAY INTERVAL 'FULL SCAN' OMIT OWNER AND AVAILABLE, ADJUST QUERY STRING, SET EVENT FIRED TO TRUE
            // ELSE IF NEXT DAY, SET EVENT FIRED TO FALSE
            if(addresses.body.message > 0){
                query = `/init?sort=updatedAt:acs`
            }
            else if(moment().isoWeekday() === conf.weekdayInterval && !conf.eventFired){
                // UPDATE QUERY
                query = `?sort=updatedAt:acs`
                // debugging
                console.log(`full scan, weekday ${conf.weekdayInterval}, weekday ${moment().isoWeekday()}`)
                // UPDATE EVENT FIRED TO TRUE
                await httpFetch(baseUrl, `/configs/schedules/event/${conf._id}`, true, '?event=true', 'PATCH', jwt)
            }
            else if (((conf.weekdayInterval - moment().isoWeekday()) === -1 || (conf.weekdayInterval - moment().isoWeekday()) === 6) && conf.eventFired){
                // UPDATE EVENT FIRED TO FALSE
                // debugging
                console.log(`passed full scan, weekday ${conf.weekdayInterval}, weekday ${moment().isoWeekday()}`)
                await httpFetch(baseUrl, `/configs/schedules/event/${conf._id}`, true, '?event=false', 'PATCH', jwt)
            }

            // ADD LIMIT TO QUERY STRING VARIABLE
            var query = `${query}&limit=${conf.scanLimit}`
            // SPECIFY TCP PORTS 
            ports = conf.portList

            // SCAN FUNCTION 
            if(conf.scannerSync){
                // await scanSync(baseUrl, path, query, jwt, ports)
            }
            else {
                // await scanAsync(baseUrl, path, query, jwt, ports)
            }

        } catch (e) {
            console.error(e)
            throw new Error(e)
            clearInterval()
        }
    // }
}


// TIMERS FUNCTION
// Nested setTimeout calls is a more flexible alternative to setInterval
// https://javascript.info/settimeout-setinterval#setinterval
// 1 min to ms 60000 ms 
var count = 0
let timeId = setTimeout(async function configTimer() {
    console.log(`\n* * * timer : ${timer}, count ${count++} * * *\n`)
    httpFetch(baseUrl, '/configs/schedules?endpoint=address', true, '', 'GET', jwt)
    .then((conf) => {
        if(conf.body){
            console.log('conf.body :', conf.body)
            // MINUTE INTERVAL ADJUST TIMER OF DELAY, FREQUENCY OF SCAN 
            timer = conf.body.minuteInterval*60000
            setTimeout(run, 0, baseUrl, '/addresses', `?available=true&owner=null&sort=updatedAt:acs`, jwt, conf.body)
            timeId = setTimeout(configTimer, timer)
            // console.log({
            //     timer: timer, 
            //     timeId: timeId
            // })
        }
    })
    .catch((err) => {
        console.error(err)
    })
}, timer)