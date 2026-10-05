/*
 * Router registry. Every feature gets its own router file, and this is the one
 * place where they are mounted. Adding a feature means adding one line here.
 */
const express = require('express')

const healthRoutes = require('./health.routes')

const router = express.Router()

// Mounted at "/" so the single path below becomes GET /api/health
router.use('/', healthRoutes)

module.exports = router