const { logger } = require('../src/util/log')
const jwt = require('jsonwebtoken')
const User = require('../model/user')
const moment = require('moment')
const { userJWTExpiring } = require('../email/message')

// AUTH FUNC
// middleware needs to be registered/used before other router calls
const auth = async (req, res, next) => {

    // LOGGER
    logger.log('info', `${moment()} auth connection ${req.method} ${req.path}`)

    try {
        // VALID METHODS
        if (!req.method.match(/(GET|POST|PATCH|DELETE)/)) {
            return res.status(400).send({message:'Invalid method'})
        }

        // VERIFY JWT
        // replace Bearer string with '' string and verify token within header against JWT secret and decode _id within data play-load
        // debugging
        // console.log('req.header =')
        // console.log(req.headers)

        const token = req.header('Authorization').replace('Bearer ', '')

        // if expired with throw error, see jwt.sign() in user model
        const decoded = jwt.verify(token, process.env.JSON_WEB_TOKEN_SECRET)
        // see moment module
        const dateNow = moment()
        const dateExp = moment(decoded.exp*1000)
        // const dateExp = new Date(decoded.exp*1000)

        // FIND USER BASED ON ID
        // find id with token provided 
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })

        // bearer user not found
        if (!user) {
            throw new Error()
        }
        // JWT ABOUT TO EXPIRE SEND ONE TIME NOTIFICATION
        if(dateExp.diff(dateNow, 'hours') < (user.maxTTL/3)){
            if(!user.userNoc && user.userConfirmed){
                await userJWTExpiring(user.emailAddress, user.userName)
                user.userNoc = true
                await user.save()
            }
        } else {
            // used to show the amount of time remaining in the currently used token
            user.expireInHours = dateExp.diff(dateNow, 'hours')
        }

        // debugging, toggle between days, hours, minutes see jwt.sign() in user model
        // console.log('dateExp.diff, hours = ')
        // console.log(dateExp.diff(dateNow, 'hours'))

        // ADDRESSES PATH
        // addresses path access control, only allow userAdmin access 
        if(req.path.match(/^\/addresses\/checkout/)){
            if(!user.userConfirmed){
                throw new Error()
            }
        }
        else if(req.path.match(/^\/addresses\/init/) || req.path.match(/^\/addresses\/network/) || req.path.match(/^\/addresses\/status/)){
            if(!user.userRoot){
                throw new Error()
            }
        }
        // unauthorized access on patch addresses example user could transfer ownership without being the actual owner
        else if(req.path.match(/^\/addresses/) && !req.method.match(/GET/) && !user.userAdmin){
            throw new Error()
        }

        // ADMINS PATH
        // admins path access control, only allow userAdmin access 
        if(req.path.match(/^\/admins/)){
            if(!user.userAdmin){
                throw new Error()
            }
            // if changing root user within req.body to another account 
            if(Object.keys(req.body).indexOf('userRoot') !== -1){
                // require userAdmin and userConfirmed set to true
                if(!req.body.userAdmin && !req.body.userConfirmed){
                    throw new Error()
                }
                // require userRoot set to true
                if (user.userRoot !== true){
                    throw new Error()
                }
                user.userRoot = false
            }
        }

        // CONFIGS PATH
        // networks path access control, only allow userAdmin access 
        if(req.path.match(/^\/configs\/suggest/)){
            if(!user.userConfirmed){
                throw new Error()
            }
        }
        else if(req.path.match(/^\/configs\/schedules\/event/)){
            if(!user.userRoot){
                throw new Error()
            }
        }
        else if(req.path.match(/^\/configs/)){
            if(!user.userAdmin){
                throw new Error()
            }
        }

        // NETWORKS PATH
        // networks path access control, only allow userAdmin access 
        if(req.path.match(/^\/networks/)){
            if(!user.userAdmin){
                throw new Error()
            }
        }

        // USERS PATH
        // access control not required
       
        // give the route handler the user fetched from the database
        req.token = token
        req.user = user
        next()
    } catch (e) {
        logger.log('error', `${moment()} auth connection ${e.message}`)
        if (e.message){
            return res.status(401).send({message:`Auth, ${e.message}`})
        }
        res.status(401).send({message:'Please authenticate'})
    }
}

module.exports = auth

