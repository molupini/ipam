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

module.exports = { logger }