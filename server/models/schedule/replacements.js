const mongoose = require('mongoose')

const replacementsSchema = new mongoose.Schema({
  classID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Class'
  },
  replacements: [],
  roomRpls: [],
  infoRpls: []
}, { collection: 'replacements' })

replacementsSchema.virtual('Classes', {
  ref: 'Class',
  localField: 'classID',
  foreignField: '_id'
})

const Replacements = mongoose.model('Replacements', replacementsSchema)

module.exports = Replacements