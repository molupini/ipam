const logging = require("../src/util/log")
const jwt = require("jsonwebtoken")
const User = require("../model/user")

// middleware needs to be registered/used before other router calls
const auth = async (req, res, next) => {
    // maintenance 
    // return res.status(503).send({ error: "Currently under maintenance" })
    
    // logging
    // logging(req, process.env.LOG_USER_REQUEST)

    try {
        // valid methods
        if (!req.method.match(/(GET|POST|PATCH|DELETE)/)) {
            return res.status(400).send({
                error: "Invalid method"
            })
        }
        // replace Bearer string with '' string and verify token within header against JWT secret and decode _id within data play-load
        const token = req.header("Authorization").replace("Bearer ", "")
        const decoded = jwt.verify(token, process.env.JSON_WEB_TOKEN_SECRET)
        
        // TODO - message.userJWTExpiring
        // find id with token provided 
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })
        // bearer user not found
        if (!user) {
            throw new Error()
        }

        // admins path access control, only allow userAdmin access 
        if(req.path.match(/^\/admins\//)){
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
        // networks path access control, only allow userAdmin access 
        if(req.path.match(/^\/admins\//)){
            if(!user.userAdmin){
                throw new Error()
            }
        }
        // addresses path access control, only allow userAdmin access 
        if(req.path.match(/^\/addresses\//)){
            if(!user.userConfirmed){
                throw new Error()
            }
        }
        // give the route handler the user fetched from the database
        req.token = token
        req.user = user
        next()
    } catch (e) {
        res.status(401).send({error:'Please authenticate'})
    }
}

module.exports = auth

