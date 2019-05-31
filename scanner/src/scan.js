// scan is based on using a http request module called got
// https://www.npmjs.com/package/got
// custom modules
const { pingLoop, tcpLoop } = require("./util/network")
const { httpFetch, addressPatchLoop } = require("./util/http")

// env variables 
// const ports = ['80','5986','3389','22']
const ports = ['80','22']
const urlAddress = `http://localhost:3000`
const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1Y2YxMzQzNTllNTg4YTAwMTJmNWMyYTAiLCJpYXQiOjE1NTkzMTE0MjAsImV4cCI6MTU5MDg0NzQyMH0.tC2YkFKM12IxjF8R151ztF2uQhAbU38XXQK8CpuQVuk'


// main function
// TODO - query string / options will be sent via run/cron function
async function scan(){
    try {
        // starting
        console.log({info:'Scanner Running, Interrogate IP Address Manager'})
        // fetch function, get initialize addresses
        // TODO move to own job
        const getInit = await httpFetch(urlAddress, '/addresses/init', true, '', 'GET', jwt)
        // nothing to initialize 
        if(!getInit){
            // debugging
            // console.log(getInit)
        }
        // fetch function, get addresses 
        const getAddresses = await httpFetch(urlAddress, '/addresses', true, '?sort=updatedAt:acs', 'GET', jwt)
        if(!getAddresses.body){
            // debugging
            // console.log(getAddresses)
        }
        const body = getAddresses.body
        // ping function
        const resultPing = await pingLoop(body)
        // debugging
        // console.log({result: resultPing})
        // patch addresses 
        const resultAddresses = await addressPatchLoop(resultPing, urlAddress, '/addresses', '?available=', jwt)
        // console.log(resultAddresses)
        const after = resultAddresses.filter(post => post.isAvailable === true)
        // debugging
        // console.log(after)
        // tcp function, single port
        const resultTcp = await tcpLoop(after, ports)
        // debugging
        // console.log(resultTcp)
        const set = new Set(resultTcp)
        const array = [...set]
        // debugging
        // console.log(array)
        const objects = []
        array.forEach(element => {
            const object = {
                id: element.split(':')[0],
                host: element.split(':')[1],
                alive: element.split(':')[2] === 'true'
            }
            objects.push(object)
        })
        if(objects.length > 0){
            // PATCH ADDRESSES, FINAL CHECK UNTIL DNS TESTING
            // debugging
            // console.log(objects)
            const resultAddresses = await addressPatchLoop(objects, urlAddress, '/addresses', '?available=', jwt)
            // debugging
            // console.log(resultAddresses)
        }
        // completed
    } catch (e) {
        console.log('scan(), catch')
        console.error(e)
    }
}

scan()
