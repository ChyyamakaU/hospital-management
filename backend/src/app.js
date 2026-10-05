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
 *
 * Two details that are easy to get wrong:
 *
 * 1. A rejected origin calls `callback(null, false)`, NOT `callback(new Error)`.
 *    Throwing turns a blocked cross-origin call into a 500 in our own logs and
 *    in the frontend's error message, which hides the real problem. Returning
 *    false simply omits the CORS headers, and the browser blocks the call -
 *    which is the correct behaviour.
 *
 * 2. Outside production we also accept any localhost port. Vite moves to the
 *    next free port when 5173 is taken, and browsers send an Origin header even
 *    for same-origin POSTs, so a hard-coded port would break local work.
 */
const isLocalOrigin = (origin) =>
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)

app.use(
  cors({
    origin(origin, callback) {
      // No origin means a non-browser client (curl, Postman, the Render health
      // check). Those are safe to allow.
      if (!origin) return callback(null, true)

      if (config.corsOrigins.includes(origin)) return callback(null, true)

      if (config.env !== 'production' && isLocalOrigin(origin)) {
        return callback(null, true)
      }

      return callback(null, false)
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