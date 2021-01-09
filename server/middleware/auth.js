const jwt = require('jsonwebtoken')
const Planer = require('../models/users/planer')
const Teacher = require('../models/users/teacher')
const Student = require('../models/users/student')
const log = console.log

const auth = async (req, res, next, accountTypeRequired) => {
    try {
        const accountType = req.header('Account-Type').replace('AccountTypeBearer ', '')

        console.log('account type:', accountType)
        console.log('types required:', accountTypeRequired)

        if (!accountTypeRequired.includes(accountType)) {
            throw new Error()
        }

        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.SECRET_CODE)
        
        switch(accountType) {
            case 'planer':
                const planer = await Planer.findOne({ _id: decoded._id, 'tokens.token': token })
                if (!planer) {
                    throw new Error()
                }
                req.token = token
                req.planer = planer
                break;
            case 'teacher':
                const teacher = await Teacher.findOne({ _id: decoded._id, 'tokens.token': token })
                if (!teacher) {
                    throw new Error()
                }
                req.token = token
                req.teacher = teacher
                break;
            case 'student':
                const student = await Student.findOne({ _id: decoded._id, 'tokens.token': token })
                if (!student) {
                    throw new Error()
                }
                req.token = token
                req.student = student
                break;
        }

        next()
    } catch(err) {
        console.log(err)
        res.status(401).send({error: 'Please authenticate.'})
    }
}

module.exports = auth
