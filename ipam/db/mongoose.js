const mongoose = require('mongoose')
const { logger } = require('../src/util/log')
const moment = require('moment')

const options = {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    // autoIndex: false,
    user: process.env.MONGODB_USER,
    pass: process.env.MONGODB_PASS_FILE, 
    reconnectTries: 30,
    reconnectInterval: 500,
    poolSize: 10,
    bufferMaxEntries: 0
}

// debugging
// console.log('db object=')
// console.log(options)
// console.log('db url=')
// console.log(process.env.MONGODB_URL)

const mongooseConnection = () => {
    mongoose.connect(process.env.MONGODB_URL, options).then((result) => {
        logger.log('info', `${moment()} mongoose connected`)
    }).catch((e) => {
        logger.log('info', `${moment()} mongoose not connected, retry in 5 seconds`)
        setTimeout(mongooseConnection, 5000)
    })
}

mongooseConnection()



