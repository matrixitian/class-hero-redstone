const mongoose = require('mongoose')

const UnevenScheduleSchema = new mongoose.Schema({
  classID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Class'
  },
  days: [[], [], [], [], []],
  couplers: [[], [], [], [], []],
  scheduleCopied: false
})

UnevenScheduleSchema.virtual('Classes', {
  ref: 'Class',
  localField: 'classID',
  foreignField: '_id'
})

const UnevenSchedule = mongoose.model('UnevenSchedule', UnevenScheduleSchema)

module.exports = UnevenSchedule