const mongoose = require('mongoose')
const validator = require('validator')

const messengerSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Author',
    },
    provider: {
        type: String,
        trim: true, 
        lowercase: true, 
        default: 'email',
        validate(value){
            if(!value.match(/(api|email|sms|slack|chat)/)){
                throw new Error('Please provide valid data')
            }
        },
        unique: true 
    },
    emailFrom: {
        type: String,
        trim: true, 
        lowercase: true, 
        default: 'noreply@default.co.za',
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Please provide valid data')
            }
        }
    },
    emailSupport: {
        type: String,
        trim: true, 
        lowercase: true, 
        default: 'support@default.co.za',
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Please provide valid data')
            }
        }
    },
    isAvailable: {
        type: Boolean,
        trim: false
    },
    endpointFQDN: {
        type: String,
        trim: true, 
        lowercase: true, 
        default: 'endpoint.unknown',
        validate(value){
            if(!validator.isFQDN(value)){
                throw new Error('Please provide valid data')
            }
        }
    },
    endpointPort: {
        type: String,
        trim: true, 
        default: '80',
        validate(value){
            if(!validator.isPort(value)){
                throw new Error('Please provide valid data')
            }
        }
    },
    endpointProtocol: {
        type: String,
        trim: true, 
        lowercase: true,
        default: 'http',
        validate(value){
            if(!(value).match(/(http|https)/)){
                throw new Error('Please provide valid data')
            }
        }
    },
    token:{
        type: String,
        default: null,
        trim: true
    },
    relayHost:{
        type: String,
        default: 'mail.google.com',
        trim: true,
        validate(value){
            if(!validator.isFQDN(value)){
                throw new Error('Please provide valid data')
            }
        }
    },
    relayPort:{
        type: String,
        default: '587',
        trim: true,
        validate(value){
            if(!validator.isPort(value)){
                throw new Error('Please provide valid data')
            }
        }
    },
    replayLogger:{
        type: Boolean,
        default: true
    },
    isEnabled:{
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

// multi unique fields, suitable for multi tenancy 
// globalSchema.index({author: 1, endpoint: 1}, {unique: true})


messengerSchema.methods.toJSON = function(){
    return this.toObject()
}

const Messenger = mongoose.model('Messenger', messengerSchema)

module.exports = Messenger