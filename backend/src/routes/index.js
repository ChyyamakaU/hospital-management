const express = require('express')

const healthRoutes = require('./health.routes')
const authRoutes = require('./auth.routes')
const adminRoutes = require('./admin.routes')
const patientRoutes = require('./patient.routes')
const medicineRoutes = require('./medicine.routes')

const router = express.Router()

router.use('/', healthRoutes)
router.use('/auth', authRoutes)
router.use('/admin', adminRoutes)
router.use('/patients', patientRoutes)
router.use('/medicines', medicineRoutes)

module.exports = router