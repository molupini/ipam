const mongoose = require("mongoose")

const logSchema = new mongoose.Schema({
    date: {
        type: String,
        required: true
    },
    method: {
        type: String,
        required: true  
    },
    path: {
        type: String,
        required: true
    },
    headers: {
        type: String,
        required: false
    }
})

logSchema.methods.toJSON = function () {
    return this.Object()
}

const Log = mongoose.model("Log", logSchema)

module.exports = Log