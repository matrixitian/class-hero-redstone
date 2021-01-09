const mongoose = require('mongoose')

const scheduleSchema = new mongoose.Schema({
  classID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Class'
  },
  days: [[], [], [], [], []],
  couplers: [[], [], [], [], []]
})

scheduleSchema.virtual('Classes', {
  ref: 'Class',
  localField: 'classID',
  foreignField: '_id'
})

const Schedule = mongoose.model('staticSchedule', scheduleSchema)

module.exports = Schedule