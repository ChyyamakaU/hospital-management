const express = require('express')
const {
  listMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} = require('../controllers/medicine.controller')

const router = express.Router()

router.get('/', listMedicines)
router.get('/:id', getMedicineById)
router.post('/', createMedicine)
router.put('/:id', updateMedicine)
router.delete('/:id', deleteMedicine)

module.exports = router