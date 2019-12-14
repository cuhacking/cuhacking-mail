const express = require('express')
const path = require('path')
const app = express()
const { logger, stringify } = require('./helpers/logger')

const users = require('./routes/users')

// Allow the server to parse JSON
app.use(express.json())

// Log each request the server receives
app.use('*', (req, res, next) => {
  logger.info(`HTTP request received: ${req.method} -> ${req.originalUrl}`)
  next()
})

// Log all errors
app.use((error, req, res, next) => {
  logger.error(`Express error: ${stringify(error)}`)
  res.sendStatus(error.status || 500)
})

app.use('/users', users)

const port = process.env.PORT || 3000
app.listen(port)

logger.info(`cuHacking Mail is listening on port ${port}${process.env.DEV ? ' in development mode' : ''}`)
