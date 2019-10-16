// modules
const mongoose = require('mongoose')

const cidrSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Network'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        default: null,
        ref:'User'
    },
    fromToRange: {
        type: String,
        required: true,
        default: null,
        trim: true,
        // unique: true,
        index: true
    }, 
    regexPattern: {
        type: String,
        required: false,
        default: null,
        trim: true
    }
}, {
})

cidrSchema.index({author: 1, fromToRange: 1}, {unique: true})

// toJSON
cidrSchema.methods.toJSON = function () {
    const cidr = this.toObject()
    return cidr
}

// pre save
cidrSchema.pre('save', async function (next) {
    const cidr = this
    if (cidr.isNew) {
        const exclusion = cidr.fromToRange
        if (exclusion.match(/(\-)/)){
            const array = exclusion.split(/(\-)/)
            var string0 = '^('
            var correct = true
            var array3 = []
            for (y = 0; y < 4; y++){
                var array0 = parseInt(array[0].split('.')[y])
                var array2 = parseInt(array[2].split('.')[y])
                // debugging
                // console.log('array0 =')
                // console.log(array0)
                // console.log('array2 =')
                // console.log(array2)
                if (array0 === array2){
                    string0 += `${array0}\\.`
                } else if (array0 < array2 && correct) {
                    var string1 = '('
                    for (z = array0; z <= array2; z++){
                        string1 += `${z}|`
                    }
                    string1 = string1.replace(/\|$/, ')\\.')
                    array3.push(string1)
                } else {
                    correct = false
                }
            }
            if (!correct) { 
                string0 = string0.replace('^(', '')
            }
            array3 = array3.join('')
            var reg = string0+=array3
            if (correct) {
                reg = reg.replace(/\\.$/, ')$')
            }
            // console.log('reg =')
            // console.log(reg)
            // const re = new RegExp(reg)
            // console.log('re =')
            // console.log(re)
            cidr.regexPattern = reg
            // const r = new RegExp(reg)
            // debugging
            // console.log(r)
        }
    }
    next()
})

const Cidr = mongoose.model('Cidr', cidrSchema)

module.exports = Cidr