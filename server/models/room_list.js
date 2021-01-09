const mongoose = require('mongoose')

const roomListSchema = new mongoose.Schema({
  schoolID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  roomTypes: {
    type: Array
  },
  rooms: [
    {   
      name: {
        type: String,
        required: true
      },
      type: {
        type: String,
        required: true
      },
      staticTakenHours: [[], [], [], [], []],
      uw_staticTakenHours: [[], [], [], [], []],
      dynamicTakenHours: [[], [], [], [], []]
    }
  ],
  dynamicRoomsTaken: [
    {
      day: {
        type: String,
        requried: true
      },
      roomsTaken: []
    }
  ]
})

const roomList = mongoose.model('roomList', roomListSchema)

module.exports = roomList