const mongoose = require('mongoose')

const schoolSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    city: {
        type: String,
        trim: true,
        required: true
    },
    roomCategories: [],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Planer'
    }
})

schoolSchema.virtual('planer', {
    ref: 'Planer',
    localField: '_id',
    foreignField: 'schoolID'
})

schoolSchema.virtual('students', {
    ref: 'Student',
    localField: '_id',
    foreignField: 'school'
})

schoolSchema.virtual('subjects', {
    ref: 'Subject',
    localField: '_id',
    foreignField: 'school'
})

schoolSchema.virtual('planer', {
    ref: 'Planer',
    localField: '_id',
    foreignField: 'schoolID'
})

schoolSchema.virtual('scheduleTimes', {
    ref: 'scheduleTimes',
    localField: '_id',
    foreignField: 'schoolID'
})

const School = mongoose.model('School', schoolSchema)

module.exports = School