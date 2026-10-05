/*
 * express-validator collects validation failures on `req.validationErrors`
 * (Express 5). This middleware turns them into one readable 400 response
 * instead of letting each controller re-check them.
 */
const validate = (req, res, next) => {
  const errors = (req.validationErrors && req.validationErrors()) || (req.errors) || []

  // Express 5 returns validation result differently; also try validationResult
  const { validationResult } = require('express-validator')
  const result = validationResult(req)
  if (result && !result.isEmpty()) {
    const details = result.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
    }))
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: details,
    })
  }

  if (errors && errors.length > 0) {
    const details = errors.map((error) => ({
      field: error.path || error.param,
      message: error.msg,
    }))
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: details,
    })
  }

  return next()
}

/*
 * Wraps an async controller so a rejected promise reaches the error handler.
 * In Express 5 this is automatic, but keeping it makes the intent obvious.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

module.exports = { validate, asyncHandler }