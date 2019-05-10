require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const corsOptions = require('./cors-whitelist')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const validateBearerToken = require('./validateBearerToken')
const errorHandler = require('./error-handler')
const bookmarksRouter = require('./Routers/bookmarks-router')

const app = express()

const morganOption = NODE_ENV === 'production' ? 'tiny' : 'dev'

app.use(morgan(morganOption))
app.use(cors({ origin: corsOptions }))
app.use(helmet())

app.use(validateBearerToken)

app.get('/', (req, res) => {
  res.send("Nick's Bookmarks Server!")
})

app.use(bookmarksRouter)

app.use(errorHandler)

module.exports = app
