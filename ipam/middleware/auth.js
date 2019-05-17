const logging = require("../src/util/log")
const jwt = require("jsonwebtoken")
const User = require("../model/user")

// TODO setup middleware as per account time example users only get, admin all supported

// middleware needs to be registered/used before other router calls
const auth = async (req, res, next) => {
    
    // maintenance 
    // return res.status(503).send({ error: "Currently under maintenance" })
    // logging
    // logging(req, process.env.LOG_USER_REQUEST)

    try {
        // vaild methods
        // TODO move into logging ?
        if (!req.method.match(/(GET|POST|PATCH|DELETE)/)) {
            return res.status(400).send({
                error: "Invaild method"
            })
        }

        const token = req.header("Authorization").replace("Bearer ", "")
        const decoded = jwt.verify(token, process.env.JSON_WEB_TOKEN_SERCET)
        
        // TODO - message.userJWTExpiring
        // console.log('decoded :', decoded);
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })
        if (!user) {
            throw new Error()
        }

        // give the route handler the user fetched from the database
        req.token = token
        req.user = user
        next()
    } catch (e) {
        res.status(401).send({error:"Please authenticate"})
    }
}

module.exports = auth

