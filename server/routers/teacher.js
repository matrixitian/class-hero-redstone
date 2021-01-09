const express = require('express')
const Teacher = require('../models/users/teacher')
const Subject = require('../models/subject')
const Student = require('../models/users/student')
const StudentData = require('../models/data/student_data')
const auth = require('../middleware/auth')
const router = new express.Router()

router.get('/list-enrolled-subjects', async (req, res, next) => {
    auth(req, res, next, ['teacher'])
}, async(req, res) => {
    const teacher = req.teacher
    const subjects = await Subject.find({ teacher: teacher._id })
    res.send(subjects)
})

router.get('/list-students-in-subject', async (req, res, next) => {
    auth(req, res, next, ['teacher'])
}, async(req, res) => {
    const openSubjectID = req.body.openSubjectID
    const students = await StudentData.find({ subject: openSubjectID }, 'studentID')

    let studentsInSubject = []

    await Promise.all(students.map(async (singleStudent) => {
        const studentID = singleStudent.studentID
        const studentSubjectDocID = singleStudent._id
       
        const foundStudent = await Student.findOne({ _id: studentID}, 'name')

        let studentObj = {
            studentSubjectDocID,
            studentID, // in front end recreate this object and set to visual representation
            name: foundStudent.name
        }

        studentsInSubject.push(studentObj)
    }))  
    res.send(studentsInSubject)
})

router.post('/add-grade', async (req, res, next) => {
    auth(req, res, next, ['teacher'])
}, async(req, res) => {
    const { clickedStudentID, grade, comment} = req.body

    const studentData = await StudentData.findOne({ studentID: clickedStudentID })
    studentData.grades.push({
        grade,
        comment
    })

    const saved_data = await studentData.save()

    res.send(saved_data)
})

router.post('/add-notice', async (req, res, next) => {
    auth(req, res, next, ['teacher'])
}, async(req, res) => {
    const { clickedStudentID, notice, noticeType} = req.body
    let studentData

    try {
        studentData = await StudentData.findOne({ studentID: clickedStudentID })
        studentData.notices.push({
            notice,
            noticeType
        })
    } catch(err) {
        res.status(400).send(err)
    }

    const saved_data = await studentData.save()
    res.send(saved_data)
})

router.post('/add-attendance', async (req, res, next) => {
    auth(req, res, next, ['teacher'])
}, async(req, res) => {
    const { clickedStudentID, hoursToUpdate} = req.body

    const studentData = await StudentData.findOne({ studentID: clickedStudentID })
    studentData.attendance.push({
        // hours
    })

    const saved_data = await studentData.save()

    res.send(saved_data)
})

router.post('/fetch-teacher-schedule-data', async (req, res, next) => {
    auth(req, res, next, ['teacher'])
}, async(req, res) => {
    const unevenWeek = req.body.unevenWeek

    let data
    if (unevenWeek) {
        data = await Teacher.findById(req.teacher, 
            `uw_staticNotAvailableData`)
        return res.send({scheduleData: data.uw_staticNotAvailableData})
    } else {
        data = await Teacher.findById(req.teacher, 
            `staticNotAvailableData`)
        return res.send({scheduleData: data.staticNotAvailableData})
    }
})

module.exports = router