// modules
// const scanner = require('./scan')
// const schedule = require('node-schedule')
const CronJob = require('cron').CronJob
// custom modules
const { httpFetch } = require('./util/http')

// env variables 
// const urlAddress = process.env.EXPRESS_URL
// const jwt = process.env.JWT_SCANNER
const urlAddress = `http://localhost:3000`
const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1Y2YxMzQzNTllNTg4YTAwMTJmNWMyYTAiLCJpYXQiOjE1NTkzMTE0MjAsImV4cCI6MTU5MDg0NzQyMH0.tC2YkFKM12IxjF8R151ztF2uQhAbU38XXQK8CpuQVuk'

// TEST BOTH CRON AND WHILE LOOP
// function cron (pattern = '* * * * * *', baseUrl, path, query){
//     var count = 0
//     new CronJob(pattern, function(){
//         count++
//         console.log(`cron ${pattern} count: ${count}`)
//         console.log(`${baseUrl}${path}${query}`)
//     }, null, true)
// }

// main function 
async function run(baseUrl, jwt){
    // while (true) {
        try {
            var limit = 100
            const path = '/addresses'
            // var full = null
            var delta = `?available=true&owner=null&sort=updatedAt:acs&limit=${limit}`
    
            // fetchSchedule 
            const httpSchedule = await httpFetch(baseUrl, '/configs/schedules?endpoint=address', true, '', 'GET', jwt)
            const addressInit = await httpFetch(baseUrl, '/addresses/init?count=true', true, '', 'GET', jwt)
            if(!httpSchedule){
                return 1
            }
            // debugging
            console.log(httpSchedule.body)
            console.log(addressInit.body)
    
            // run cronJob
            if(addressInit.body.count === true){
                delta = `/init?sort=updatedAt:acs&limit=${limit}`
            }
    
            console.log(baseUrl, path, delta)
    
            // httpSchedule.body.cronScheduleDelta
            // cron('* * * * * *', baseUrl, path, delta)
            
            // httpSchedule.body.cronScheduleFull
            // cron(httpSchedule.body.cronScheduleFull, baseUrl, false)
            
        } catch (e) {
            console.error(e)
        }
    
    // }
}

run(urlAddress, jwt)
// setTimeout(run, 5000, urlAddress, jwt)


