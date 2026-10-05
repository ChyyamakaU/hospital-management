const { validationResult } = require('express-validator')

/*
 * express-validator attaches its results to the request. This middleware turns
 * them into one readable 400 response instead of letting each controller
 * re-check them by hand.
 */
const validate = (req, res, next) => {
  const result = validationResult(req)

  if (!result.isEmpty()) {
    const errors = result.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }))

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    })
  }

  return next()
}

/*
 * Wraps an async controller so a rejected promise reaches the error handler.
 * Express 5 forwards rejections automatically, but keeping this makes the
 * intent explicit and the code portable.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

module.exports = { validate, asyncHandler }