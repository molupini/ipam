const Log = require("../../model/log")
const winston = require('winston')

var level = null

if (process.env.NODE_ENV !== 'development') {
    level = 'error'
} else {
    level = 'info'
}

const logger = new winston.createLogger({
    level,
    format: winston.format.json(),
    transports: [
        new winston.transports.Console()
    ]
})

const logging = async (req, level) => {
    try {
        if (level !== "None") {
            const utc = new Date(Date.now())
            if (level === "Basic") {

                const log = await new Log({
                    date: utc,
                    method: req.method,
                    path: req.path
                })

                await log.save()
                console.log(log)
            }
            if (level === "Verbose") {

                const log = await new Log({
                    date: utc,
                    method: req.method,
                    path: req.path,
                    headers: req.headers
                })

                await log.save()
                console.log(log)
            }
        }
    } catch (e) {
        console.log(e)
    }

}

module.exports = { logging, logger }