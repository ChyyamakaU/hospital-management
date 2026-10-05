const express = require('express')
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/order.controller')

const router = express.Router()

router.post('/', createOrder)
router.get('/my-orders', getMyOrders)
router.get('/:id', getOrderById)
router.get('/', getAllOrders)
router.put('/:id/status', updateOrderStatus)

module.exports = router