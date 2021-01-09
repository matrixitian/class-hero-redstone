const auth = require('../middleware/auth')
const express = require('express')
const router = new express.Router()
const Planer = require('../models/users/planer')
const School = require('../models/school')
const Teacher = require('../models/users/teacher')
const Student = require('../models/users/student')
const Subject = require('../models/subject')
const Class = require('../models/class')
const ScheduleTimes = require('../models/schedule/schedule_times')
const Schedule = require('../models/schedule/schedule')
const UnevenSchedule = require('../models/schedule/uneven_schedule')
const Replacements = require('../models/schedule/replacements')
const RoomList = require('../models/room_list')
const cloneDeep = require('clone-deep')
const log = console.log

router.post('/teacher-and-subject-manager', (req, res, next) => {
  auth(req, res, next, ['planer'])
}, async (req, res) => {
  let teachers = req.body.teachers
  let teachersForArchive = req.body.teachersForArchive
  let subjects = req.body.subjects

  if (teachers  == [] && subjects == [] && teachersForArchive == []) {
    throw new Error()
  }

  // Create Teacher Accounts
  let generatedUsernames = []
  await Promise.all(teachers.map(async (singleTeacher) => {
    singleTeacher.password = 'passwort'
    singleTeacher.schoolID = req.planer.schoolID 
      
    // Generate Username
    await Planer.generateUsername(singleTeacher.name).then(async (generatedUsername) => {
      singleTeacher.username = generatedUsername
  
      try {
        const newTeacher = new Teacher(singleTeacher)
        let savedTeacher = await newTeacher.save()

        generatedUsernames.push({
          counterID: singleTeacher.counterID,
          username: savedTeacher.username
        })
      } catch(err) {
        log(err)
        res.status(400).send('Bad request.')
      }
    })      
  }))

  // Archive Teacher Accounts
  await Promise.all(teachersForArchive.map(async (singleTeacher) => {
    try {
      await Teacher.findOneAndUpdate({username: singleTeacher.username}, {
        archived: true
      })

    } catch(err) {
      log(err)
      res.status(400).send('Archivation failed.')
    }    
  }))

  // Create Subjects
  await Promise.all(subjects.map(async (subj) => {
    try {
      const newSubj = new Subject(subj)
      await newSubj.save()

      await Teacher.findOneAndUpdate({username: subj.teacherUname}, {
        $push: {
          subjects: newSubj._id
        }
      })
    } catch(err) {
      log(err)
      res.status(400).send('Bad request.')
    }  
  }))

  updateLastSaveTime(req.planer._id)

  // Return usernames and subject IDs
  return res.status(201).json({usernames: generatedUsernames})
})

router.get('/fetch-tm-data', (req, res, next) => {
  auth(req, res, next, ['planer'])
}, async(req, res) => {
  try {
    const fetchedTeachers = await Teacher.find(
      { schoolID: req.planer.schoolID }, '_id name username subjects archived'
    )

    let subjectIDs = []
    fetchedTeachers.forEach(teacher => {
      teacher.subjects.forEach(subjID => {
        subjectIDs.push(subjID)
      })

      teacher.subjects = []
    })

    let subjects = []
    await Promise.all(subjectIDs.map(async (subjID) => {
      let subj = await Subject.findById(subjID)

      subjects.push(subj)
    }))

    return res.send({teachers: fetchedTeachers, subjects: subjects})
  } catch(err) {
    log(err)
    return res.send(err)
  }
})

router.post('/check-last-save-time', (req, res, next) => {
  auth(req, res, next, ['planer'])
}, async(req, res) => {
  log('received')
  const LSTime = req.body.LSTime

  try {
    const appUpToDate = new Date(LSTime) < new Date(req.planer.lastSaveDate)
    log(appUpToDate)
    
    return res.send(appUpToDate)
  } catch (err) {
    log(err)
    return res.send(err)
  }
})

router.post('/create-class', (req, res, next) => {
    auth(req, res, next, ['planer'])
}, async (req, res) => {
    try {
        const _class = new Class({
            name: req.body.name,
            year: req.body.year,
            halfYear: req.body.halfYear,
            school: req.planer.schoolID,
        })
        
        const savedClass = await _class.save()

        // Create Static Schedule & Static Uneven Schedule for Class
        const schedule = new Schedule({ classID: savedClass._id })
        await schedule.save()

        const unevenSchedule = new UnevenSchedule({ classID: savedClass._id })
        await unevenSchedule.save()

        const replacements = new Replacements({ classID: savedClass._id })
        await replacements.save()

        return res.send(savedClass._id)
    } catch(err) {
        log(err)
        return res.send(err)
    }
})

router.post('/assign-class-teacher', (req, res, next) => {
  auth(req, res, next, ['planer'])
}, async(req, res) => {
  const classID = req.body.classID
  const teacherID = req.body.teacherID
  try {
      const schoolClass = await Class.findById(classID)
      const teacher = await Teacher.findById(teacherID, `-_id name`)
      schoolClass.classTeacher = teacherID
      schoolClass.teacherName = teacher.name
      schoolClass.save()

      res.status(200).send(schoolClass)
  } catch(err) {
      res.status(404).send(err)
  }
})

router.post('/create-student-accounts', (req, res, next) => {
  auth(req, res, next, ['planer'])
}, async (req, res) => {
  const classID = req.body.classID
  const students = req.body.students

  let studentsToAssignToClass = []
  try {
      const schoolID = req.planer.schoolID

      await Promise.all(students.map(async (singleStudent) => {
        let student = {
          name: singleStudent,
          class: classID,
          school: schoolID,
          username: null,
          password: 'passwort'
        }
        
        // Generate Username
        await Planer.generateUsername(student.name).then(async (generatedUsername) => {
            student.username = generatedUsername
            const newStudent = new Student(student)
            const savedStudent = await newStudent.save()
            
            const formattedForClassAssignment = {
              _id: savedStudent._id,
              username: savedStudent.username,
              name: savedStudent.name
            }

            studentsToAssignToClass.unshift(formattedForClassAssignment)
        }) 
      }))

      await Class.updateOne({ _id: classID}, 
        { $push: {assignedStudents: studentsToAssignToClass }}  
      )

      return res.send(studentsToAssignToClass)
  } catch(err) {
      log(err)
      return res.status(500).send(err)
  }
})

router.post('/create-subject', (req, res, next) => {
  auth(req, res, next, ['planer'])
}, async (req, res) => {
  try {
      const subject = await new Subject({
          name: req.body.name,
          teacher: req.body.teacherID,
          school: req.planer.schoolID,
          teacherName: req.body.teacherName,
          teacherUname: req.body.teacherUname
      })
      await subject.save()

      // create student_data (student_data is student grades etc. for subjects, because they don't contain that)
      const students = await Student.find({ class: req.body.classID }, '_id')
      await Promise.all(students.map(async (singleStudent) => {
          
          const student_data = new StudentData({
              studentID: singleStudent._id,
              subject: subject._id,
              created: subject.created
          })
          const saved_student_data = await student_data.save()
      }))

      res.status(201).send(subject)
  } catch(err) {
      res.status(400).send(err)
  }
})

async function updateLastSaveTime(id) {
  try {
    await Planer.findByIdAndUpdate(id, {
      lastSaveDate: new Date()
    })
  } catch(err) {
    log(err)
  }
}

router.post('/fetch-planer-data', (req, res, next) => {
  auth(req, res, next, ['planer'])
}, async(req, res) => {
  res.send(req.planer)
})

router.post('/delete-subject', (req, res, next) => {
  auth(req, res, next, ['planer'])   
}, async(req, res) => {
  const _id = req.body._id

  try {
      const deleted = await Subject.deleteOne({ _id })
  
      res.send(deleted)
  } catch(err) {
      res.send(err)
  }   

})

router.post('/fetch-teacher-manager-subjects', (req, res, next) => {
  auth(req, res, next, ['planer'])
}, async(req, res) => {
  const teacherIDs = req.body.teacherIDs

  let allSubjects = []
  try {
    for await (const teacherID of teacherIDs) {
      let subjects = await Subject.find({ teacher: teacherID}, '_id name teacher')
      allSubjects.push(subjects)
    }
  } catch(err) {
      allSubjects.push([])
  }
 
  res.send(allSubjects)
})

router.patch('/assign-subject-to-class', (req, res, next) => {
  auth(req, res, next, ['planer'])
}, async(req, res) => {
  const classID = req.body.classID
  const subject = req.body.subject

  try {
    await Class.updateOne(
      { _id: classID }, 
      { $push: { 
        assignedSubjects: subject}
      }
    )

    return res.send()
  } catch(err) {
    return res.send(err)
  }
})

router.get('/fetch-existing-subjects', (req, res, next) => {
  auth(req, res, next, ['planer'])
}, async(req, res) => {
  const schoolID = req.planer.schoolID

  try {
      const fetchedSubjects = await Subject.find({ school: schoolID },
          `_id name teacherName teacher teacherUname`)

      return res.status(200).send(fetchedSubjects)
  } catch(err) {
      log(err)
      return res.status(400).send(err)
  }  
})

router.post('/fetch-class-names', (req, res, next) => {
  auth(req, res, next, ['planer'])
}, async(req, res) => {
  try {  
      const classes = await Class.find(
          { 
          school: req.body.schoolID, 
          year: new Date().getFullYear(),
          halfYear: 1
          }, 
          `_id name`
      )
      res.send(classes)
  } catch (err) {
      res.status(404).send(err)
  }
})

router.get('/fetch-schedule-times', (req, res, next) => {
  auth(req, res, next, ['planer'])
}, async(req, res) => {
  const schoolID = req.planer.schoolID

  try {
    const scheduleTimes = await ScheduleTimes.find({ schoolID }, `-_id -schoolID -__v`)
    return res.status(200).send(scheduleTimes)
  } catch(err) {
    log(err)
    return res.send(err)
  }
})

router.patch('/update-schedule-times', (req, res, next) => {
  auth(req, res, next, ['planer'])
}, async(req, res) => {
  const schoolID = req.planer.schoolID
  const { hoursFrom, hoursTo } = req.body

  try {
      await ScheduleTimes.findOneAndUpdate({schoolID}, { hoursFrom, hoursTo })
      return res.status(204).send()
  } catch(err) {
      return res.status(400).send(err)
  }
})

router.patch('/create-room-category', (req, res, next) => {
  auth(req, res, next, ['planer'])
}, async(req, res) => {
  const category = req.body.category

  try {
    await RoomList.updateOne(
      { schoolID: req.planer.schoolID }, 
      { $push: { roomTypes: category } }
    )

    return res.send()
  } catch(err) {
    return res.send(err)
  }
})

router.get('/fetch-room-types', (req, res, next) => {
  auth(req, res, next, ['planer'])
}, async(req, res) => {
  try {
    let roomList = await RoomList.find({schoolID: req.planer.schoolID})
    roomList = roomList[0].roomTypes

    return res.json(roomList)
  } catch(err) {
    return res.send(err)
  }
})

router.patch('/create-room', (req, res, next) => {
  auth(req, res, next, ['planer'])
}, async(req, res) => {
  const name = req.body.name
  const type = req.body.type

  try {
    await RoomList.updateOne(
      { schoolID: req.planer.schoolID }, 
      { $push: { 
        rooms: {
          name,
          type,
          staticTakenHours: [[], [], [], [], []],
          uw_staticTakenHours: [[], [], [], [], []]
        }}
      }
    )

    return res.send()
  } catch(err) {
    return res.send(err)
  }
})

router.get('/fetch-rooms', (req, res, next) => {
  auth(req, res, next, ['planer', 'teacher'])
}, async(req, res) => {
  try {
    let rooms = await RoomList.find({schoolID: req.planer.schoolID})
    rooms = rooms[0].rooms

    return res.json(rooms)
  } catch(err) {
    return res.send(err)
  }
})

router.post('/delete-room', (req, res, next) => {
  auth(req, res, next, ['planer'])
}, async(req, res) => {
  try {
    const roomID = req.body._id
    
    const roomList = await RoomList.find({schoolID: req.planer.schoolID})
    const rooms = roomList[0].rooms

    const index = rooms.findIndex(room => room._id == roomID)
    
    roomList[0].rooms.splice(index, 1)
    
    await RoomList.updateOne(
      { schoolID: req.planer.schoolID }, 
      { rooms: roomList[0].rooms }
    )

    return res.json(rooms)
  } catch(err) {
    return res.send(err)
  }
})

router.get('/fetch-classes', (req, res, next) => {
  auth(req, res, next, ['planer', 'teacher'])
}, async(req, res) => {
  let schoolID

  if (req.planer) {
    schoolID = req.planer.schoolID
  } else if (req.teacher) {
    schoolID = req.teacher.schoolID
  } else if (req.student) {
    schoolID = req.student.schoolID
  }

  try {
      const classes = await Class.find({ school: schoolID }, '_id name year halfYear classTeacherName assignedSubjects assignedStudents')

      return res.send(classes)
  } catch(err) {
      log(err)
      return res.send(err)
  }
})

router.post('/fetch-assigned-subjects', (req, res, next) => {
  auth(req, res, next, ['planer', 'teacher'])
}, async(req, res) => {
  const classID = req.body.classID

  try {
    let _class = await Class.findById(classID)
    const classObj = _class.toObject()

    let i = 0
    for await (const subject of _class.assignedSubjects) {
      let data = await Teacher.find({username: subject.teacherUname}, 
        `staticNotAvailable uw_staticNotAvailable staticNotAvailableData uw_staticNotAvailableData`)

      classObj.assignedSubjects[i].staticNotAvailable = data[0].staticNotAvailable
      classObj.assignedSubjects[i].staticNotAvailableData = data[0].staticNotAvailableData
      classObj.assignedSubjects[i].uw_staticNotAvailable = data[0].uw_staticNotAvailable
      classObj.assignedSubjects[i].uw_staticNotAvailableData = data[0].uw_staticNotAvailableData
      classObj.assignedSubjects[i].teacherID = data[0]._id

      i++
    }
    
    res.json(classObj)
  } catch (err) {
    log(err)
    res.send(err)
  }
})

router.get('/fetch-teacher-accounts-scheduler', (req, res, next) => {
  auth(req, res, next, ['planer'])
}, async(req, res) => {
  try {
    const teachers = await Teacher.find(
      { school: req.planer.schoolID }, `_id name username dynamicNotAvailable`
    )

    let teachersWithSubjects = []
    await Promise.all(teachers.map(async (teacher) => {
      let subjects = await Subject.find(
        { teacher: teacher._id }, '_id name'
      )
      
      let teacherObj = {
        name: teacher.name,
        _id: teacher._id,
        username: teacher.username,
        dynamicNotAvailable: teacher.dynamicNotAvailable,
        subjects
      }

      teachersWithSubjects.push(teacherObj)
    }))

    return res.send(teachersWithSubjects)
  } catch(err) {
    log(err)
    return res.send(err)
  }
})

router.post('/fetch-class-schedule', (req, res, next) => {
  auth(req, res, next, ['planer', 'teacher'])
}, async(req, res) => {
  const classID = req.body.classID
  const unevenWeek = req.body.unevenWeek

  try {
    let schedule
    if (unevenWeek) {
      schedule = await UnevenSchedule.findOne({ classID }, `days couplers scheduleCopied`)
    } else {
      schedule = await Schedule.findOne({ classID }, `days couplers`)
    }

    return res.status(200).send(schedule)
  } catch(err) {
    log(err)
    return res.status(400).send(err)
  }
})

router.post('/fetch-class-replacements', (req, res, next) => {
  auth(req, res, next, ['planer', 'teacher', 'student'])
}, async(req, res) => {
  const classID = req.body.classID

  try {
    const replacements = await Replacements.findOne({ classID }, `replacements roomRpls infoRpls`)

    return res.status(200).send(replacements)
  } catch(err) {
    log(err)
    return res.status(400).send(err)
  }
})

router.get('/fetch-teacher-replacements', (req, res, next) => {
  auth(req, res, next, ['teacher'])
}, async(req, res) => {
  const teacherID = req.teacher._id

  try {
    log(req.teacher.replacements)
    const teacher = await Teacher.findById(teacherID, `fallOffs dynamicNotAvailable dynamicRoomRpls`)
    log(teacher)
    
    return res.send(teacher)
  } catch (err) {
    log(err)
    return res.send(err)
  }
})

router.post('/update-class-replacements', (req, res, next) => {
  auth(req, res, next, ['planer', 'teacher', 'student'])
}, async(req, res) => {
  let schoolID
  if (req.planer) schoolID = req.planer.schoolID
  else if (req.teacher) schoolID = req.teacher.schoolID
  else if (req.student) schoolID = req.student.school

  const classID = req.body.classID
  const replacements = req.body.replacements
  const roomRpls = req.body.roomRpls
  const infoRpls = req.body.infoRpls
  const teachersForUpdate = req.body.teachersForUpdate
  const roomsForUpdate = req.body.roomsForUpdate

  try {
    await Promise.all(teachersForUpdate.map(async(teacherUpdate) => {
      let teacher = await Teacher.findById(teacherUpdate.teacherID)

      // let teacherRplIndex
      // teacherUpdate.replacementIndexesForRemoval.forEach(async(rpl) => {
      //   teacherRplIndex = teacher.dynamicNotAvailable.findIndex(x => 
      //     x.day == rpl.day &&
      //     x.hour == rpl.hour &&
      //     x.date == rpl.date
      //   )

      //   if (teacherRplIndex != -1) {
      //     teacher.dynamicNotAvailable.splice(teacherRplIndex, 1)
      //   }
      // })
      // remove room rpls from teacher and then push room rpls into teacher.dynamicRoomRpls
      teacher.fallOffs.push(...teacherUpdate.fallOffs)
      teacher.dynamicNotAvailable.push(...teacherUpdate.dynamicNotAvailable)

      await teacher.save()
    }))

    await Promise.all(roomsForUpdate.map(async(roomUpdate) => {
      let roomList = await RoomList.findOne({schoolID})

      let roomRplIndex
      roomUpdate.replacementIndexesForRemoval.forEach(async(rpl) => {
        roomRplIndex = roomList.dynamicTakenHours.findIndex(x => 
          x.day == rpl.day &&
          x.hour == rpl.hour &&
          x.coupler == rpl.coupler &&
          x.date == rpl.date
        )

        if (roomRplIndex != -1) {
          roomList.dynamicTakenHours.splice(roomRplIndex, 1)
        }
      })

      roomList.dynamicNotAvailable = roomRpls

      await roomList.save()
    }))

    await Replacements.findOneAndUpdate({ classID }, { replacements, roomRpls })

    return res.status(200).send()
  } catch(err) {
    log(err)
    return res.status(400).send(err)
  }
})

router.get('/fetch-schedule-column-num', (req, res, next) => {
  auth(req, res, next, ['planer', 'teacher'])
}, async(req, res) => {
  let schoolID

  if (req.planer) {
    schoolID = req.planer.schoolID
  } else if (req.teacher) {
    schoolID = req.teacher.schoolID
  } else if (req.student) {
    schoolID = req.student.schoolID
  }

  try {
    const scheduleTimes = await ScheduleTimes.find({schoolID})
    const columnsNum = scheduleTimes[0].hoursFrom.length

    return res.send({columnsNum})
  } catch(err) {
    return res.send(err)
  }
})

router.post('/update-schedule', (req, res, next) => {
  auth(req, res, next, ['planer'])
}, async(req, res) => {
  const classID = req.body.classID
  const newSchedule = req.body.newSchedule
  const teachersForUpdate = req.body.teachersForUpdate
  const roomsForUpdate = req.body.roomsForUpdate
  const couplers = req.body.couplers
  const unevenWeek = req.body.unevenWeek
  const scheduleCopied = req.body.scheduleCopied

  // log(roomsForUpdate[0].uw_staticTakenHours[4])

  try {
    let oldSchedule
    if (unevenWeek) {
      oldSchedule = await UnevenSchedule.find({classID})
    } else {
      oldSchedule = await Schedule.find({classID})
    }
    
    oldSchedule = oldSchedule[0].days

    if (unevenWeek) {
      await UnevenSchedule.updateOne(
        { classID }, 
        { days: [...newSchedule],
          couplers,
          scheduleCopied }
      )
    } else {
      await Schedule.updateOne(
        { classID }, 
        { days: [...newSchedule],
          couplers }
      )
    }

    if (unevenWeek) {
      await Promise.all(teachersForUpdate.map(async (teacherUpdate) => {
        await Teacher.updateOne(
          { _id: teacherUpdate.teacherID }, 
          { uw_staticNotAvailable: teacherUpdate.uw_staticNotAvailable,
            uw_staticNotAvailableData: teacherUpdate.uw_staticNotAvailableData },
        )
      }))
    } else {
      await Promise.all(teachersForUpdate.map(async (teacherUpdate) => {
        await Teacher.updateOne(
          { _id: teacherUpdate.teacherID }, 
          { staticNotAvailable: teacherUpdate.staticNotAvailable,
            staticNotAvailableData: teacherUpdate.staticNotAvailableData },
        )
      }))
    }
    
    // Update Rooms
    const roomListObj = await RoomList.find({schoolID: req.planer.schoolID})
    let roomList = cloneDeep(roomListObj[0].rooms)
    
    await Promise.all(roomsForUpdate.map(async (roomUpdate) => {
      roomList.forEach(room => {
        if (room._id == roomUpdate._id) {
          if (unevenWeek) {
            room.uw_staticTakenHours = roomUpdate.uw_staticTakenHours
          } else {
            room.staticTakenHours = roomUpdate.staticTakenHours
          }
        }
      })     
    }))

    const saved = await RoomList.updateOne(
      { schoolID: req.planer.schoolID }, 
      { rooms: roomList },
    )

    log(saved)

    return res.send()
  } catch(err) {
    log(err)
    return res.status(400).send(err)
  }
})

router.patch('/archive-student', (req, res, next) => {
  auth(req, res, next, ['planer'])
}, async(req, res) => {
  const studentID = req.body.studentID

  try {
    await Student.updateOne(
      { _id: studentID }, 
      { 
        archived: true
      }
    )

    return res.send()
  } catch(err) {
    return res.send(err)
  }
})

router.patch('/remove-subject-from-class', (req, res, next) => {
  auth(req, res, next, ['planer'])
}, async(req, res) => {
  const classID = req.body.classID
  const subjectID = req.body.subjectID

  let subjects = await Class.findById(classID, {_id: false, assignedSubjects: true})
  subjects = subjects.assignedSubjects

  // Remove Subject
  let filteredSubjects = []
  subjects.forEach(subject => {
    if (subject._id != subjectID) {
      filteredSubjects.push(subject)
    }
  })

  try {
    await Class.updateOne(
      { _id: classID }, 
      { 
        assignedSubjects: filteredSubjects
      }
    )

    return res.send()
  } catch(err) {
    return res.send(err)
  }
})

module.exports = router