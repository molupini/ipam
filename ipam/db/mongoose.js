const mongoose = require('mongoose')
const { logger } = require('../src/util/log')
const moment = require('moment')

const options = {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    // autoIndex: false,
    reconnectTries: 30,
    reconnectInterval: 500,
    poolSize: 10,
    bufferMaxEntries: 0
}

const mongooseConnection = () => {
    mongoose.connect(process.env.MONGODB_URL, options).then((result) => {
        logger.log('info', `${moment()} mongoose connected`)
    }).catch((e) => {
        logger.log('info', `${moment()} mongoose not connected, retry in 5 seconds`)
        setTimeout(mongooseConnection, 5000)
    })
}

mongooseConnection()



