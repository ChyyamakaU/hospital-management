const { body, param } = require('express-validator')
const prisma = require('../config/prisma')
const { sendSuccess, sendError } = require('../utils/response')
const { asyncHandler, validate } = require('../middleware/validate')
const { authenticate, authorizeAdmin } = require('../middleware/auth')

/**
 * POST /api/orders
 * Patient places an order. Must have a patient profile. Validates stock,
 * computes total on server, creates order + items, reduces stock, all in one transaction.
 */
const createOrder = [
  authenticate,
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.medicineId').isInt().withMessage('medicineId must be an integer'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('quantity must be at least 1'),
  validate,
  asyncHandler(async (req, res) => {
    const userId = req.user.id
    const { items } = req.body

    // Find patient profile for this user
    const patient = await prisma.patient.findUnique({ where: { userId } })
    if (!patient) {
      return sendError(res, 404, 'Patient profile not found. Please create one.')
    }

    const order = await prisma.$transaction(async (tx) => {
      let totalAmount = 0
      const orderItemsData = []

      for (const item of items) {
        const medicine = await tx.medicine.findUnique({
          where: { id: item.medicineId },
        })
        if (!medicine) {
          const err = new Error(`Medicine with ID ${item.medicineId} not found`)
          err.statusCode = 404
          throw err
        }
        if (medicine.stockQuantity < item.quantity) {
          const err = new Error(
            `Insufficient stock for ${medicine.name}. Available: ${medicine.stockQuantity}, requested: ${item.quantity}`,
          )
          err.statusCode = 400
          throw err
        }
        const lineTotal = Number(medicine.price) * item.quantity
        totalAmount += lineTotal
        orderItemsData.push({
          medicineId: medicine.id,
          quantity: item.quantity,
          unitPrice: medicine.price,
        })
        // Reduce stock
        await tx.medicine.update({
          where: { id: medicine.id },
          data: { stockQuantity: { decrement: item.quantity } },
        })
      }

      // Create order
      const newOrder = await tx.order.create({
        data: {
          patientId: patient.id,
          totalAmount: totalAmount.toFixed(2),
          status: 'PENDING',
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              medicine: { select: { id: true, name: true, category: true } },
            },
          },
          patient: {
            select: {
              id: true,
              patientId: true,
              user: { select: { id: true, fullName: true, email: true } },
            },
          },
        },
      })
      return newOrder
    })

    return sendSuccess(res, { order }, 201)
  }),
]

/**
 * GET /api/orders/my-orders
 * Get current patient's orders.
 */
const getMyOrders = [
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user.id
    const patient = await prisma.patient.findUnique({ where: { userId } })
    if (!patient) return sendError(res, 404, 'Patient profile not found')
    const orders = await prisma.order.findMany({
      where: { patientId: patient.id },
      include: {
        items: { include: { medicine: { select: { id: true, name: true, category: true, price: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return sendSuccess(res, { orders })
  }),
]

/**
 * GET /api/orders/:id
 * Patient can see only their own order; admin can see any.
 */
const getOrderById = [
  authenticate,
  param('id').isInt().toInt(),
  validate,
  asyncHandler(async (req, res) => {
    const id = req.params.id
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { medicine: { select: { id: true, name: true, category: true } } } },
        patient: { include: { user: { select: { id: true, fullName: true, email: true } } } },
      },
    })
    if (!order) return sendError(res, 404, 'Order not found')
    // access control
    if (req.user.role !== 'ADMIN') {
      const me = await prisma.patient.findUnique({ where: { userId: req.user.id } })
      if (!me || me.id !== order.patientId) {
        return sendError(res, 403, 'Forbidden: You can only view your own orders')
      }
    }
    return sendSuccess(res, { order })
  }),
]

/**
 * GET /api/orders
 * Admin only: list all orders.
 */
const getAllOrders = [
  authenticate,
  authorizeAdmin,
  asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
      include: {
        items: { include: { medicine: { select: { id: true, name: true } } } },
        patient: { include: { user: { select: { id: true, fullName: true, email: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return sendSuccess(res, { orders })
  }),
]

/**
 * PUT /api/orders/:id/status
 * Admin only: update order status.
 */
const updateOrderStatus = [
  authenticate,
  authorizeAdmin,
  param('id').isInt().toInt(),
  body('status')
    .notEmpty()
    .isIn(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'])
    .withMessage('Invalid status'),
  validate,
  asyncHandler(async (req, res) => {
    const id = req.params.id
    const { status } = req.body
    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) return sendError(res, 404, 'Order not found')
    const updated = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: { include: { medicine: { select: { id: true, name: true } } } },
        patient: { include: { user: { select: { id: true, fullName: true } } } },
      },
    })
    return sendSuccess(res, { order: updated })
  }),
]

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
}
