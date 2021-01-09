const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const teacherSchema = new mongoose.Schema({
    localSubjects: {
        type: Array,
        default: []
    },
    staticNotAvailable: {
        type: Array,
        default: [[], [], [], [], []]
    },
    staticNotAvailableData: {
        type: Array,
        default: [[], [], [], [], []]
    },
    uw_staticNotAvailable: {
        type: Array,
        default: [[], [], [], [], []]
    },
    uw_staticNotAvailableData: {
        type: Array,
        default: [[], [], [], [], []]
    },
    dynamicNotAvailable: {
        type: Array,
        default: []
    },
    dynamicRoomRpls: {
        type: Array,
        default: []
    },
    dynamicInfoRpls: {
        type: Array,
        default: []
    },
    fallOffs: {
        type: Array,
        default: []
    },
    name: {
        type: String,
        required: true,
        trim: true
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
        required: true
    },
    accountType: {
        type: String,
        default: 'teacher'
    },
    schoolID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'School'
    },
    assignedClassID: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Class'
    },
    subjects: {
        type: Array,
        default: []
    },
    assignedClass: {
        type: String,
        default: null
    },
    archived: {
        type: Boolean,
        default: false
    },
    tokens: [{
        token: {
            type: String,
            required: false
        }
    }]
})

teacherSchema.virtual('class', {
    ref: 'Class',
    localField: '_id',
    foreignField: 'classTeacher'
})

teacherSchema.virtual('class', {
    ref: 'Class',
    localField: 'assignedClassID',
    foreignField: '_id'
})

teacherSchema.virtual('class', {
    ref: 'Class',
    localField: 'name',
    foreignField: 'teacherName'
})

// teacherSchema.virtual('subjects', {
//     ref: 'Subject',
//     localField: '_id',
//     foreignField: 'teacher'
// })

teacherSchema.methods.toJSON = function() {
    const teacher = this
    const teacherObject = teacher.toObject()

    delete teacherObject.password
    delete teacherObject.tokens

    return teacherObject
}

teacherSchema.methods.generateAuthToken = async function() {
    const teacher = this
    const token = jwt.sign({ _id: teacher._id.toString()}, process.env.SECRET_CODE)
    teacher.tokens = teacher.tokens.concat({ token })
    
    await teacher.save()
    return token
}

teacherSchema.pre('save', async function(next) {
    const teacher = this

    if (teacher.isModified('password')) {
        teacher.password = await bcrypt.hash(teacher.password, 8)
    }

    next()
})

const Teacher = mongoose.model('Teacher', teacherSchema)


module.exports = Teacher