/*
 * An error we throw on purpose. It carries an HTTP status code so the central
 * error handler knows what to send back.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.isOperational = true
  }
}

module.exports = AppError