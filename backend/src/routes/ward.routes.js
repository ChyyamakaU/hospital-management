const express = require('express')
const {
  listWards,
  getWardById,
  createWard,
  updateWard,
  deleteWard,
  assignPatientToWard,
  removePatientFromWard,
} = require('../controllers/ward.controller')

const router = express.Router()

router.get('/', listWards)
router.get('/:id', getWardById)
router.post('/', createWard)
router.put('/:id', updateWard)
router.delete('/:id', deleteWard)
router.post('/:wardId/patients/:patientId', assignPatientToWard)
router.delete('/:wardId/patients/:patientId', removePatientFromWard)

module.exports = router