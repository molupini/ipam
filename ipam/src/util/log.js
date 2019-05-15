const Log = require("../../model/log")

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

module.exports = logging