const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
const Planer = require('../models/users/planer')
const School = require('../models/school')
const ScheduleTimes = require('../models/schedule/schedule_times')
const RoomList = require('../models/room_list')
const generate = require('../generator')
const log = console.log

router.post('/create-planer', async (req, res) => {
    const creatorKey = req.body.creatorKey

    let planerObj = {
        ...req.body,
        password: generate('password'),
        recoveryKey: generate('recovery_key')
    }

    try {
        if (!(creatorKey === process.env.CREATOR_CODE)) throw new Error('Access key invalid.')
         // Create Planer Account
        const generatedUsername = await Planer.generatePlanerUsername('planer', planerObj.schoolName, planerObj.city)
        planerObj.username = generatedUsername

        const planer = new Planer(planerObj)
        await planer.save()
        
         // Create School
        const school = new School({
            name: req.body.schoolName,
            city: req.body.city,
            owner: planer._id
        })
        
        const savedSchool = await school.save()
        planer.schoolID = savedSchool._id
        await planer.save() // assign School to Planer

        // Create Schedule Times
        const scheduleTimes = new ScheduleTimes({ schoolID: savedSchool._id })
        const savedScheduleTimes = await scheduleTimes.save()

        // Create Room List
        const roomList = new RoomList({ schoolID: savedSchool._id })
        const savedRoomList = await roomList.save()

        return res.status(201).send({
            planer: planerObj,
            scheduleTimes: savedScheduleTimes,
            roomList: savedRoomList
        })
    } catch(err) {
        return res.status(500).send(err)
    }
})

// Login all types of users
router.post('/login', async (req, res) => {
    try {
        const user = await Planer.findByCredentials(req.body.username, req.body.password)
        const token = await user.generateAuthToken()
        res.status(200).send({ user, token })
    } catch(err) {
        res.status(400).send("error") 
    }
})

router.post('/logout', (req, res, next) => {
    const accountType = req.body.accountType
    auth(req, res, next, accountType, req.body.authToken)
}, async (req, res) => {
    const accountType = req.body.accountType
    try {
        if (accountType === 'planer') {
            req.planer.tokens = req.planer.tokens.filter((token) => {
                return token.token !== req.token
            })
            await req.planer.save()
            res.send()
        } else if (accountType === 'teacher') {
            req.teacher.tokens = req.teacher.tokens.filter((token) => {
                return token.token !== req.token
            })
            await req.teacher.save()
            res.send()
        } else if (accountType === 'student') {
            req.student.tokens = req.student.tokens.filter((token) => {
                return token.token !== req.token
            })
            await req.student.save()
            res.send()
        }
    } catch(err) {
        res.status(500).send()
    }
})

// Logout all (receive accountType from front-end)
router.post('/logout-all', (req, res, next) => {
    const accountType = req.body.accountType
    auth(req, res, next, accountType)
}, async (req, res) => {
    const accountType = req.body.accountType
    try {
        if (accountType === 'planer') {
            req.planer.tokens = []
            await req.planer.save()
            res.send()
        } else if (accountType === 'teacher') {
            req.teacher.tokens = []
            await req.teacher.save()
            res.send()
        } else if (accountType === 'student') {
            req.student.tokens = []
            await req.student.save()
            res.send()
        }
    } catch(err) {
        res.status(500).send(err)
    }
})

router.post('/recover-account', async (req, res) => {
    try {
        const planer = await Planer.findByRecoveryKey(req.body.username, req.body.recoveryKey)
       
        const token = await planer.generateAuthToken()
       
        res.status(200).send({ user: planer, token })
    } catch(err) {
        res.status(400).send() 
    }
})


module.exports = router