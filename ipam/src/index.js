// modules
const express = require("express")
const app = express()
require("../db/mongoose")
const { logger } = require('./util/log')

// routers
const userRouter = require("../router/user")
const networkRouter = require("../router/network")
const addressRouter = require("../router/address")

// port
const port = process.env.PORT

// config/middleware
app.use(express.json()) // auto parse incoming req
app.use(userRouter)
app.use(networkRouter)
app.use(addressRouter)

app.use('/healthv', (req, res) => {
    res.status(200).send('healthy')
})

// listening
app.listen(process.env.PORT, () => {
    logger.log('info', "EXPRESS")
    logger.log('info', `PORT=${process.env.PORT}`)
    logger.log('info', `NODE_ENV=${process.env.NODE_ENV}`)
})
