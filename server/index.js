require('dotenv').config()
require('./db/mongoose')
const express = require('express')
const cors = require('cors')

const pre_entry = require('./routers/pre_entry')
const planer = require('./routers/planer')
const teacher = require('./routers/teacher')

const app = express()
const port = process.env.PORT || 3000

app.use(cors({
    'allowedHeaders': ['Authorization', 'Account-Type', 'Content-Type'],
    'exposedHeaders': ['Authorization', 'Account-Type'],
    'origin': '*',
    'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
    'preflightContinue': false
}))

app.use(express.json())

app.use(pre_entry)
app.use(planer)
app.use(teacher)


app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})