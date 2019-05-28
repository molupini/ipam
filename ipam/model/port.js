const mongoose = require('mongoose')
const validator = require('validator')
const Address = require('../model/address')


const portSchema = new mongoose.Schema({
    author:{
        type: mongoose.Schema.Types.ObjectId,
        required: true, 
        default: null,
        ref:'Address'
    },
    portNumber:{
       type: String, 
       required: true,
       default: null, 
       validate(value){
           if(!validator.isPort(value)){
               throw new Error('Please provide valid port')
           }
       }
    }
}, {
    timestamps: true
})

portSchema.index({author: 1, portNumber: 1}, {unique: true})

portSchema.methods.toJSON = function(){
    return this.toObject()
}

// for future use. 
portSchema.pre('save', async function (next) {
    next()    
})

const Port = mongoose.model('Port', portSchema)

module.exports = Port