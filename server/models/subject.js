const mongoose = require('mongoose')

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    teacherName: {
        type: String,
        required: true
    },
    teacherUname: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        required: false,
        default: new Date()
    }
})

const Subject = mongoose.model('Subject', subjectSchema)

module.exports = Subject