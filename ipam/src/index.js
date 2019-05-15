// modules
const express = require("express")
const app = express()
require("../db/mongoose")

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

// listening
app.listen(port, () => {
    console.log('listening on port :', port);    
})