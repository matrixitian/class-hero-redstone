const mongoose = require('mongoose')

const scheduleTimesSchema = new mongoose.Schema({
  schoolID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'School'
  },
  hoursFrom: {
    type: Array,
    default: [
      '08:00',
      '08:45',
      '09:45',
      '10:30',
      '11:30',
      '12:15',
      '13:30',
      '14:15'
    ]
  },
  hoursTo: {
    type: Array,
    default: [
      '08:45',
      '09:30',
      '10:30',
      '11:15',
      '12:15',
      '13:00',
      '14:15',
      '15:00'
    ]
  }
})

scheduleTimesSchema.virtual('Schools', {
  ref: 'School',
  localField: 'schoolID',
  foreignField: '_id'
})

const scheduleTimes = mongoose.model('scheduleTimes', scheduleTimesSchema)

module.exports = scheduleTimes