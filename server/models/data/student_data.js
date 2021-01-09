const mongoose = require('mongoose')

const studentDataSchema = new mongoose.Schema({
    studentID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Student'
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Subject'
    },
    grades: [{
        date: {
            type: Date,
            default: new Date()
        },
        grade: {
            type: Number,
            required: true
        },
        comment: String
    }],
    notices: [{
        date: {
            type: Date,
            default: new Date()
        },
        notice: {
            type: String,
            required: true
        },
        noticeType: String // -- 'Good' or 'Bad'
    }],
    attendance: [{
        date: {
            type: Date,
            default: new Date()
        },
        hours: []
    }], // late: {} ??
    created: {
        type: Date,
        required: true // set after subject is created from subject.created
    }
})



const StudentData = mongoose.model('StudentData', studentDataSchema)

module.exports = StudentData