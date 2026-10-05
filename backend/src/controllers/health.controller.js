/* eslint-disable no-undef */
const asyncHandler = require('../middleware/validate').asyncHandler

/**
 * Simple health check. The frontend home page calls this on load, so if you
 * see "Connected to the backend", both servers are talking correctly.
 */
const health = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Hospital Management API is running',
    data: { uptime: process.uptime(), timestamp: new Date().toISOString() },
  })
})

module.exports = { health }