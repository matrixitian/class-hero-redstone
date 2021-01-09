const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Teacher = require('../users/teacher')
const Student = require('../users/student')
const log = console.log

const planerSchema = new mongoose.Schema({
    lastSaveDate: {
        type: Date
    },
    username: {
        type: String,
        trim: true,
        required: true
    },
    password: {
        type: String,
        minlength: 7,
        trim: true,
        required: true,
        validate(value) {
            if (value.includes('password')) {
                throw new Error('Password cannot contain "password"')
            }
        }
    },
    recoveryKey: {
        type: String,
        trim: true,
        required: true
    },
    accountType: {
        type: String,
        default: 'planer'
    },
    schoolID: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'School'
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
})

planerSchema.virtual('schools', {
    ref: 'School',
    localField: '_id',
    foreignField: 'owner'
})

planerSchema.methods.toJSON = function() {
    const planer = this
    const planerObj = planer.toObject()

    delete planerObj.password
    delete planerObj.tokens

    return planerObj
}

planerSchema.methods.generateAuthToken = async function() {
    const planer = this
    const token = jwt.sign({ _id: planer._id.toString()}, process.env.SECRET_CODE)
    planer.tokens = planer.tokens.concat({ token })

    await planer.save()
    return token
}

// define findByCredentials func
planerSchema.statics.findByCredentials = async (username, password) => {
    const planer = await Planer.findOne({ username })
    let teacher
    let student

    if (!planer) {
        teacher = await Teacher.findOne({ username })
        if (!teacher) {
            student = await Student.findOne({ username })
        }
    }

    if (!planer && !teacher && !student) {
        throw new Error('Unable to login.')
    }

    let isMatch

    if (planer) {
        isMatch = await bcrypt.compare(password, planer.password)
    } else if (teacher) {
        isMatch = await bcrypt.compare(password, teacher.password)
    } else if (student) {
        isMatch = await bcrypt.compare(password, student.password)
    }

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    if (planer) {return planer}
    else if (teacher) {return teacher}
    else if (student) {return student}
}

planerSchema.statics.findByRecoveryKey = async (username, recoveryKey) => {
    const planer = await Planer.findOne({ username })
    const isMatch = await bcrypt.compare(recoveryKey, planer.recoveryKey)

    if (!isMatch) throw new Error()
    else return planer
}

planerSchema.statics.generatePlanerUsername = async(accountType, schoolName, city) => {
    schoolName = schoolName.toLowerCase()
    city = city.toLowerCase()

    let usernameArray
    let generatedSchoolName = ""
    let wordIndex = 0
    if (
    schoolName.includes('-') ||
    schoolName.includes(' - ') ||
    schoolName.includes(' ')
    ) {
        usernameArray = schoolName.split(/[\s-]+/)
        usernameArray.forEach(word => {
            wordIndex = 0
            if (word.charAt(0) === "(" || word.charAt(0) === "-" || word.charAt(0) === ".") {
                wordIndex = 1
            } else {
                word = word.charAt(0)
            }

            generatedSchoolName = generatedSchoolName + word.charAt(wordIndex)
        })
    }

    let generatedCityName
    const startChar = city.charAt(0)
    const middleChar = city.charAt(Math.floor((city.length - 1) / 2))
    const endChar = city.charAt(city.length - 1)
    generatedCityName = startChar + middleChar + endChar

    let randNum
    let generatedUsername
    let count
    const genUsernameAndCountDocs = async() => {
        randNum =  Math.floor(Math.random() * Math.floor(999))

        generatedUsername = `${generatedSchoolName}.${generatedCityName}.${accountType}.${randNum}`.toLowerCase()

        if (accountType === 'planer') {
            count = await Planer.countDocuments({ // Check if username exists
                username: { $regex: new RegExp(generatedUsername) }
            })
        }
    }
    
    genUsernameAndCountDocs()

    if (count >= 1) { // while username taken, generate new
        genUsernameAndCountDocs()
    } else {
        return generatedUsername
    }
}

planerSchema.statics.generateUsername = async(name) => {
    name = name.split(' ')
    name = name.toString()

    var newchar = '.'
    name = name.split(',').join(newchar);

    let generatedUsername = `${name}`.toLowerCase()
    let countTracker = 0

    const Count = ((count) => {
        if (count >= 1) {
            count++
            countTracker += count
        }
    })

    await Promise.all([Teacher, Student].map(async (model) => {
        const count = await model.countDocuments({
            username: { $regex: new RegExp(generatedUsername) }
        })

        Count(count)
    }))  
    
    if (countTracker === 0) {
        generatedUsername = `${name}`.toLowerCase()
    } else {
        generatedUsername = `${name}.${countTracker}`.toLowerCase()
    }
    
    return generatedUsername
}


planerSchema.pre('save', async function(next) {
    const planer = this

    if (planer.isModified('password')) {
        planer.password = await bcrypt.hash(planer.password, 8)
    }

    if (planer.isModified('recoveryKey')) {
        planer.recoveryKey = await bcrypt.hash(planer.recoveryKey, 8)
    }
    
    next()
})

const Planer = mongoose.model('Planer', planerSchema)


module.exports = Planer