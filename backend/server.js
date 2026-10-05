const app = require('./src/app')
const config = require('./src/config')

/*
 * server.js is the only file that opens a network port.
 *
 * Render sets the PORT environment variable automatically, which is why we read
 * it from config instead of hardcoding 5000.
 */
const server = app.listen(config.port, () => {
  console.log(
    `Server running in ${config.env} mode on http://localhost:${config.port}`,
  )
})

// Log a friendly message instead of crashing silently.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason)
  server.close(() => process.exit(1))
})

module.exports = server