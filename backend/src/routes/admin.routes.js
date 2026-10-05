const express = require('express')
const { getDashboard } = require('../controllers/admin.controller')

const router = express.Router()

router.get('/dashboard', getDashboard)

module.exports = router