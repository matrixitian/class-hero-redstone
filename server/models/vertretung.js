const mongoose = require('mongoose')

const vertretungSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    fHour: {
        type: Number,
        required: true
    },
    lHour: {
        type: Number,
        required: true
    },
    subjectID: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    room: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true
        }
    },
    class: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        name: {
            type: String,
            required: true
        }
    },
    schoolID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'School'
    },
    created: {
        type: Date,
        required: false,
        default: new Date()
    }
})

const Vertretung = mongoose.model('Vertretung', vertretungSchema)

module.exports = Vertretung