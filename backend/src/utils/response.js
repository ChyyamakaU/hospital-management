/*
 * A tiny response helper so every controller returns the same JSON shape:
 *
 *   { success: true, data: ... }
 *   { success: false, message: "...", errors: [...] }
 *
 * Consistent shapes mean the frontend can always read `data` or `message`.
 */
const sendSuccess = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data })

const sendMessage = (res, message, statusCode = 200) =>
  res.status(statusCode).json({ success: true, message })

const sendError = (res, statusCode, message, errors) =>
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  })

module.exports = { sendSuccess, sendMessage, sendError }