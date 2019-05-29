// scan is based on using a http request module called got
// https://www.npmjs.com/package/got

const got = require('got')
const { doTcpCheck, doPingCheck } = require("./util/network")

const urlAddress = `http://localhost:3000/`
const ports = ['443','80','3389','5986','53','23','22','1433']
const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1Y2VkYTNhM2FjMjUxMjAxZDQ3NjE4YzUiLCJpYXQiOjE1NTkwNzc3OTksImV4cCI6MTU1OTY4MjU5OX0.kWQ_zxlF0t9odk1dDopm_728mkfFkl5JWf5IcjSara4'
// config client
const client = got.extend({
    json: true,
    baseUrl: urlAddress,
    headers: {
        Authorization: `Bearer ${jwt}`
    }
})

async function scan (){
    try {
        // fetch addresses 
        var addresses = await client.get('/addresses?sort=updatedAt:acs&limit=2', {json: true})
        if(!addresses.body){
           throw new Error('Unable to get addresses')
        }
        // debugging 
        // console.log(addresses)
    } catch (e) {
        console.log(e)
    }

    // ping/array of addresses function 
    const pingLoop = async (address) => {
        // debugging
        // console.log(address.length)
        let resultArray = []
        for (i = 0; i < address.length; i++) {
            // debugging
            // const addr = address[i]
            // debugging
            // console.log(`${address[i]._id}, ${address[i].address}, ping`)
            await doPingCheck(address[i].address).then((pingResult) => {
                // console.log('doPingCheck :', pingResult);
                resultArray.push(pingResult)
            })
        }
        // debugging
        // console.log('resultArray :', resultArray);
        return resultArray
    }
    // execute function 
    const pinging = await pingLoop(addresses.body)
    // debugging
    console.log('pinging :', pinging);
}

scan()
