const User = require('../../model/user')
const Network = require('../../model/network')
const message = require('../../email/message')

const FalsePositive = async (address) => {
    if(address.owner != null){
        // load trueCount threshold from environment variable 
        // create a fp FalsePositive counter
        var fp = parseInt(process.env.TRUE_COUNT_THRESHOLD)
        // evaluating if value is suitable 
        if(fp % 2 !== 0 && fp < 10){
            fp = 10
        }
        if(address.trueCount >= fp){
            // if above threshold, release address back into the wild!
            // debugging 
            // console.log({error: `Address ${address.address}, Owner ${address.owner}, trueCount ${address.trueCount}, fp ${fp}`})
            return true
        } 
        else if ((fp - address.trueCount) <= 2 ) {
            const user = await User.findById(address.owner)
            const network = await Network.findById(address.author)
            const author = await User.findById(network.author)
            // debugging 
            // console.log({warning: `Address ${address.address}, Owner ${address.owner}, Network Author ${author.id}, trueCount ${address.trueCount}, fp ${fp}`})
            await message.addressTrueCountWarn(user.emailAddress, author.emailAddress, address.address, address.owner, address.id, address.trueCount, fp)
        }
        else {
            // elseif above threshold, send information to owner to verify and add port well known ports array
            const user = await User.findById(address.owner)
            // debugging 
            // console.log('user :', user);
            // console.log({info: `Address ${address.address}, Owner ${address.owner}, trueCount ${address.trueCount}, fp ${fp}`})
            await message.addressTrueCount(user.emailAddress, address.address, address.owner, address.id, address.trueCount)
        }
        return false
    }
}

module.exports = { FalsePositive }