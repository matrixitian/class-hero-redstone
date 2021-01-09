const mongoose = require('mongoose')

const reactiveScheduleSchema = new mongoose.Schema({
    formattedDate: {
        type: String, // [DDMMYYYY] format
        required: true
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Class' 
    },
    hours: [{
        hour: {
            hourNumber: Number, // when adding new Substitude, check if any of the hours contain hourNumber === to that
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject'
        }
    }],
})

// ..

const reactiveSchedule = mongoose.model('reactiveSchedule', reactiveScheduleSchema)

module.exports = reactiveSchedule