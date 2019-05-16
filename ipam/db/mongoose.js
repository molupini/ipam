const mongoose = require("mongoose")

const options = {
    useCreateIndex: true,
    useFindAndModify: true,
    useNewUrlParser: true,
    // autoIndex: false,
    reconnectTries: 30,
    reconnectInterval: 500,
    poolSize: 10,
    bufferMaxEntries: 0
}

const mongooseConnection = () => {
    mongoose.connect(process.env.MONGODB_URL, options).then((result) => {
        console.log('mongodb - connected')
    }).catch((e) => {
        // console.log(process.env.MONGODB_URL)
        console.log('mongodb - not connected, retry in 5 seconds')
        setTimeout(mongooseConnection, 5000)
    })
}

mongooseConnection()



