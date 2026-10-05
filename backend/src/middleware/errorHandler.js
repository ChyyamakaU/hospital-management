const AppError = require('../utils/AppError')

/*
 * Centralised error handling. Express looks for a middleware with four
 * parameters and treats it as the error handler.
 *
 * Rule from requirement 24: never leak stack traces to the frontend. We log
 * the detail on the server and send only a safe message to the client.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500
  let message = err.message || 'Internal server error'

  // Errors thrown by Prisma get friendlier wording.
  if (err.code === 'P2002') {
    statusCode = 409
    message = 'A record with that value already exists'
  } else if (err.code === 'P2025') {
    statusCode = 404
    message = 'Record not found'
  } else if (err instanceof AppError) {
    statusCode = err.statusCode
  } else if (statusCode === 500) {
    // Hide unexpected internal details from the client.
    message = 'Something went wrong on the server'
  }

  console.error(`[error] ${req.method} ${req.originalUrl} ->`, err)

  res.status(statusCode).json({ success: false, message })
}

module.exports = errorHandler