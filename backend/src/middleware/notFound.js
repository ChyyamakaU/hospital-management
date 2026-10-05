/* eslint-disable no-undef */
const { sendError } = require('../utils/response')

/*
 * 404 handler. Runs when no route matched the request.
 */
const notFound = (req, res) =>
  sendError(res, 404, `Route ${req.method} ${req.originalUrl} not found`)

module.exports = notFound