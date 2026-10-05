const express = require('express')
const cors = require('cors')
const morgan = require('morgan')

const config = require('./config')
const routes = require('./routes')
const notFound = require('./middleware/notFound')
const errorHandler = require('./middleware/errorHandler')

/*
 * app.js builds the Express application but does NOT start listening.
 * server.js does that. Splitting them lets us import the app in tests without
 * opening a real network port.
 */
const app = express()

// Parse JSON bodies so we can read req.body.
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Tiny request log while developing. We keep it quiet in production.
if (config.env === 'development') {
  app.use(morgan('dev'))
}

/*
 * CORS lets the Vercel frontend (a different origin) call this API.
 * Only origins on the allow list are accepted; a browser request from any
 * other site is blocked. Credentials are not needed because we authenticate
 * with a Bearer token in the header, not with cookies.
 */
app.use(
  cors({
    origin(origin, callback) {
      // No origin means a non-browser client (curl, Postman, Render health
      // check). Those are safe to allow.
      if (!origin || config.corsOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS`))
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  }),
)

// All real endpoints live under /api.
app.use('/api', routes)

// Unmatched route -> 404, then any error -> central error handler.
app.use(notFound)
app.use(errorHandler)

module.exports = app