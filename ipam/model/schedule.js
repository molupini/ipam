// TODO - not necessary might deprecate 
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
    scannerSync:{
        type: Boolean,
        default: true
    },
    scanLimit:{
        type: Number,
        default: 5,
        minlength: 5, 
        maxlength: 240
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
            console.log('portList array :', array)
            if(array.length !== value.length){
                throw new Error('Please provide valid tcp port array')
            }
         }
    },
    weekdaySchedule:{
        type: Number, 
        // required: true,
        default: 6, 
        validate(value){
            if(!value <= 7 && !value > 0){
                throw new Error('Please provide valid ISO Day of Week')
            }
         }
     },
    cronScheduleFull: {
        type: String, 
        // required: true,
        trim: true,
        default: '0 0 */23 * * *',
        validate(value){
            if(!value.match(/^(\d{0,59}|\*|\*\/\d{0,59})\s(\d{0,59}|\*|\*\/\d{0,59})\s(\d{0,23}|\*|\*\/\d{0,23})\s(\d{1,31}|\*|\*\/\d{1,31})\s(\d{1,11}|\*|\*\/\d{1,11})\s(\d{0,6}|\*\/\d{0,6})\*$/)){
                // https://www.npmjs.com/package/cron
                throw new Error('Please provide a simple cron style schedule')
            }
         }
    },
    cronScheduleDelta: {
        type: String, 
        // required: true,
        trim: true,
        default: '0 */1 * * * *',
        validate(value){
            if(!value.match(/^(\d{0,59}|\*|\*\/\d{0,59})\s(\d{0,59}|\*|\*\/\d{0,59})\s(\d{0,23}|\*|\*\/\d{0,23})\s(\d{1,31}|\*|\*\/\d{1,31})\s(\d{1,11}|\*|\*\/\d{1,11})\s(\d{0,6}|\*\/\d{0,6})\*$/)){
                // https://www.npmjs.com/package/cron
                throw new Error('Please provide a simple cron style schedule')
            }
         }
    }
}, {
    timestamps: true
})

// scheduleSchema.index({author: 1, endpoint: 1}, {unique: true})

scheduleSchema.methods.toJSON = function(){
    return this.toObject()
}

// for future use. 
scheduleSchema.pre('save', async function (next) {
    next()    
})

const Schedule = mongoose.model('Schedule', scheduleSchema)

module.exports = Schedule