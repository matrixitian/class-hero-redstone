const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
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
        required: false
    },
    accountType: {
        type: String,
        default: 'student'
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'School'
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Class'
    },
    tokens: [{
        token: {
            type: String,
            required: false
        }
    }]
})

studentSchema.virtual('student_data', {
    ref: 'studentData',
    localField: '_id',
    foreignField: 'student'
})

studentSchema.methods.toJSON = function() {
    const student = this
    const studentObject = student.toObject()

    delete studentObject.password
    delete studentObject.tokens

    return studentObject
}

studentSchema.methods.generateAuthToken = async function() {
    const student = this
    const token = jwt.sign({ _id: student._id.toString()}, process.env.SECRET_CODE)
    student.tokens = student.tokens.concat({ token })
    
    await student.save()
    return token
}

studentSchema.pre('save', async function(next) {
    const student = this

    if (student.isModified('password')) {
        student.password = await bcrypt.hash(student.password, 8)
    }

    next()
})

const Student = mongoose.model('Student', studentSchema)


module.exports = Student