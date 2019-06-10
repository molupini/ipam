const mongoose = require('mongoose')
const validator = require('validator')

const scheduleSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref:'Author'
    },
    endpoint:{
        type: String,
        // required: true, 
        default: 'address', 
        trim: true,
        lowercase: true,
        validate(value){
            if(!value.match(/(address|admin|network|user)/)){
                throw new Error('Please provide valid data')
            }
        },
        unique: true
    },
    eventFired:{
        type: Boolean,
        default: false
    },
    scanSynchronous:{
        type: Boolean,
        default: false
    },
    limit:{
        type: Number,
        default: 5,
        validate(value){
            if(value > 100 || value < 1){
                throw new Error('Please provide valid data')
            }
        }
    },
    portList:{
        type: Array,
        default: ['3389','80','5986','22'],
        trim: true, 
        validate(value){
            let array = []
            value.forEach(element => {
                if(validator.isPort(element)){
                    array.push(true)                    
                }
            })
            // debugging 
            // console.log('portList array :', array)
            if(array.length !== value.length){
                throw new Error('Please provide valid tcp port string array')
            }
         }
    },
    minuteInterval:{
        type: Number,
        default: 1,
        validate(value){
            if(!value > 0 && !value <= 1380){
                throw new Error('Please provide valid data, in minutes')
            }
         }
    },
    weekdayInterval:{
        type: Number, 
        // required: true,
        default: 6, 
        validate(value){
            if(!value <= 7 && !value > 0){
                throw new Error('Please provide valid ISO Day of Week')
            }
         }
    }
    // useful document type, review for future use for cron style patterns 
    // ,
    // cronSchedule: {
    //     type: String, 
    //     // required: true,
    //     trim: true,
    //     default: '0 */1 * * * *',
    //     validate(value){
    //         if(!value.match(/^(\d{0,59}|\*|\*\/\d{0,59})\s(\d{0,59}|\*|\*\/\d{0,59})\s(\d{0,23}|\*|\*\/\d{0,23})\s(\d{1,31}|\*|\*\/\d{1,31})\s(\d{1,11}|\*|\*\/\d{1,11})\s(\d{0,6}|\*\/\d{0,6})\*$/)){
    //             // https://www.npmjs.com/package/cron
    //             throw new Error('Please provide a simple cron style schedule')
    //         }
    //      }
    // }
}, {
    timestamps: true
})

// multi unique fields 
// scheduleSchema.index({author: 1, endpoint: 1}, {unique: true})

scheduleSchema.methods.toJSON = function(){
    return this.toObject()
}

// scheduleSchema.pre('save', async function (next) {
//     next()    
// })

const Schedule = mongoose.model('Schedule', scheduleSchema)

module.exports = Schedule