const valid = (des = {}, ref = {}, excl = []) => {
    const updates = Object.keys(des)
    const allowedUpdates = Object.keys(ref)
   
    if (excl) {
        for (i = 0; i < excl.length; i++) {
            const e = excl[i]
            const index = allowedUpdates.indexOf(e)
            delete allowedUpdates[index]
        }
    }
    const isValid = updates.every((update) => {
        return allowedUpdates.includes(update)
    })

    return isValid
}

module.exports = valid
