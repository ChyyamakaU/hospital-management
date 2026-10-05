const express = require('express')
const {
  createPatientProfile,
  getMyProfile,
  updateMyProfile,
  getAllPatients,
  getPatientById,
} = require('../controllers/patient.controller')

const router = express.Router()

router.post('/', createPatientProfile)
router.get('/me', getMyProfile)
router.put('/me', updateMyProfile)
router.get('/', getAllPatients)
router.get('/:id', getPatientById)

module.exports = router