const mongoose = require('mongoose')

const classSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    classTeacherID: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Teacher'
    },
    classTeacherUname: {
        type: String,
        required: false
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    assignedSubjects: [
        {
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'Subject'
            },
            name: {
                type: String,
                required: true,
                ref: 'Subject'
            },
            teacherID: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'Teacher'
            },
            teacherName: {
                type: String,
                required: true
            },
            teacherUname: {
                type: String,
                required: true
            }
        }
    ],
    assignedStudents: {
        type: Array,
        required: false
    },
    year: {
        type: Number,
        maxlength: 4,
        required: true
    },
    halfYear: {
        type: String,
        maxlength: 1,
        required: true
    },
    created: {
        type: Date,
        default: new Date()
    }
})

classSchema.virtual('teachers', {
    ref: 'Teacher',
    localField: 'classTeacher',
    foreignField: '_id'
})
classSchema.virtual('teachers', {
    ref: 'Teacher',
    localField: 'teacherName',
    foreignField: 'name'
})

classSchema.virtual('classes', {
    ref: 'Class',
    localField: '_id',
    foreignField: 'assignedClassID'
})

classSchema.virtual('staticSchedules', {
    ref: 'staticSchedule',
    localField: '_id',
    foreignField: 'classID'
})

const Class = mongoose.model('Class', classSchema)

module.exports = Class