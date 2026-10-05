const { body, param, query } = require('express-validator')
const prisma = require('../config/prisma')
const { sendSuccess, sendError } = require('../utils/response')
const { asyncHandler, validate } = require('../middleware/validate')
const { authenticate, authorizeAdmin } = require('../middleware/auth')

/**
 * GET /api/medicines
 * Authenticated users (patients/admin) can view medicines.
 * Supports search/filter: q (name/description), category, inStock (true/false)
 */
const listMedicines = [
  authenticate,
  query('q').optional().trim().isLength({ max: 120 }),
  query('category').optional().trim().isLength({ max: 80 }),
  query('inStock').optional().isIn(['true', 'false']),
  query('lowStock').optional().isIn(['true', 'false']),
  query('expired').optional().isIn(['true', 'false']),
  validate,
  asyncHandler(async (req, res) => {
    const { q, category, inStock, lowStock, expired } = req.query
    const where = {}

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (category) {
      where.category = { equals: category, mode: 'insensitive' }
    }
    if (inStock === 'true') {
      where.stockQuantity = { gt: 0 }
    }
    if (inStock === 'false') {
      where.stockQuantity = { lte: 0 }
    }
    if (lowStock === 'true') {
      where.AND = [
        ...(where.AND || []),
        { stockQuantity: { lte: prisma.medicine.fields.lowStockThreshold } },
      ]
    }
    const now = new Date()
    if (expired === 'true') {
      where.expiryDate = { lt: now }
    }
    if (expired === 'false') {
      where.OR = [
        ...(where.OR || []),
        { expiryDate: null },
        { expiryDate: { gte: now } },
      ]
    }

    const medicines = await prisma.medicine.findMany({
      where,
      orderBy: { name: 'asc' },
    })
    return sendSuccess(res, { medicines })
  }),
]

/**
 * GET /api/medicines/:id
 * Authenticated users can view medicine details.
 */
const getMedicineById = [
  authenticate,
  param('id').isInt().withMessage('Invalid medicine ID').toInt(),
  validate,
  asyncHandler(async (req, res) => {
    const id = req.params.id
    const medicine = await prisma.medicine.findUnique({ where: { id } })
    if (!medicine) return sendError(res, 404, 'Medicine not found')
    return sendSuccess(res, { medicine })
  }),
]

/**
 * POST /api/medicines
 * Admin only: add a new medicine.
 */
const createMedicine = [
  authenticate,
  authorizeAdmin,
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('category').trim().notEmpty().withMessage('Category is required').isLength({ max: 80 }),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Price must be a valid decimal with up to 2 decimal places')
    .custom((v) => Number(v) >= 0)
    .withMessage('Price cannot be negative'),
  body('stockQuantity')
    .notEmpty()
    .withMessage('Stock quantity is required')
    .isInt({ min: 0 })
    .withMessage('Stock quantity cannot be negative'),
  body('lowStockThreshold')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Low stock threshold cannot be negative'),
  body('expiryDate').optional().isISO8601().withMessage('Expiry date must be valid (YYYY-MM-DD)'),
  validate,
  asyncHandler(async (req, res) => {
    const { name, description, category, price, stockQuantity, lowStockThreshold, expiryDate } = req.body

    const existing = await prisma.medicine.findUnique({ where: { name } })
    if (existing) return sendError(res, 409, 'Medicine with this name already exists')

    const medicine = await prisma.medicine.create({
      data: {
        name,
        description: description || null,
        category,
        price: price.toString(),
        stockQuantity: Number(stockQuantity),
        lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : 10,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    })
    return sendSuccess(res, { medicine }, 201)
  }),
]

/**
 * PUT /api/medicines/:id
 * Admin only: update medicine.
 */
const updateMedicine = [
  authenticate,
  authorizeAdmin,
  param('id').isInt().toInt(),
  body('name').optional().trim().isLength({ max: 120 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('category').optional().trim().isLength({ max: 80 }),
  body('price')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .custom((v) => Number(v) >= 0)
    .withMessage('Price cannot be negative'),
  body('stockQuantity').optional().isInt({ min: 0 }).withMessage('Stock quantity cannot be negative'),
  body('lowStockThreshold').optional().isInt({ min: 0 }),
  body('expiryDate').optional().isISO8601(),
  validate,
  asyncHandler(async (req, res) => {
    const id = req.params.id
    const medicine = await prisma.medicine.findUnique({ where: { id } })
    if (!medicine) return sendError(res, 404, 'Medicine not found')

    const { name, description, category, price, stockQuantity, lowStockThreshold, expiryDate } = req.body
    const data = {}
    if (name !== undefined) {
      const dup = await prisma.medicine.findFirst({ where: { name, NOT: { id } } })
      if (dup) return sendError(res, 409, 'Medicine with this name already exists')
      data.name = name
    }
    if (description !== undefined) data.description = description || null
    if (category !== undefined) data.category = category
    if (price !== undefined) data.price = price.toString()
    if (stockQuantity !== undefined) data.stockQuantity = Number(stockQuantity)
    if (lowStockThreshold !== undefined) data.lowStockThreshold = Number(lowStockThreshold)
    if (expiryDate !== undefined) data.expiryDate = expiryDate ? new Date(expiryDate) : null

    const updated = await prisma.medicine.update({ where: { id }, data })
    return sendSuccess(res, { medicine: updated })
  }),
]

/**
 * DELETE /api/medicines/:id
 * Admin only: delete medicine.
 */
const deleteMedicine = [
  authenticate,
  authorizeAdmin,
  param('id').isInt().toInt(),
  validate,
  asyncHandler(async (req, res) => {
    const id = req.params.id
    const medicine = await prisma.medicine.findUnique({ where: { id } })
    if (!medicine) return sendError(res, 404, 'Medicine not found')
    await prisma.medicine.delete({ where: { id } })
    return sendSuccess(res, { message: 'Medicine deleted successfully' })
  }),
]

module.exports = {
  listMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
}
