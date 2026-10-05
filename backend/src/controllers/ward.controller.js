const { body, param } = require('express-validator')
const prisma = require('../config/prisma')
const { sendSuccess, sendError } = require('../utils/response')
const { asyncHandler, validate } = require('../middleware/validate')
const { authenticate, authorizeAdmin } = require('../middleware/auth')

/**
 * GET /api/wards
 * Authenticated users can view wards (with occupancy).
 */
const listWards = [
  authenticate,
  asyncHandler(async (req, res) => {
    const wards = await prisma.ward.findMany({
      include: {
        _count: { select: { patients: true } },
      },
      orderBy: { name: 'asc' },
    })
    // Add a computed occupancy field for convenience
    const wardsWithOccupancy = wards.map((w) => ({
      ...w,
      occupancy: w._count.patients,
    }))
    return sendSuccess(res, { wards: wardsWithOccupancy })
  }),
]

/**
 * GET /api/wards/:id
 */
const getWardById = [
  authenticate,
  param('id').isInt().toInt(),
  validate,
  asyncHandler(async (req, res) => {
    const id = req.params.id
    const ward = await prisma.ward.findUnique({
      where: { id },
      include: {
        patients: {
          select: {
            id: true,
            patientId: true,
            user: { select: { fullName: true, email: true } },
          },
        },
        _count: { select: { patients: true } },
      },
    })
    if (!ward) return sendError(res, 404, 'Ward not found')
    return sendSuccess(res, { ward: { ...ward, occupancy: ward._count.patients } })
  }),
]

/**
 * POST /api/wards
 * Admin only: create ward.
 */
const createWard = [
  authenticate,
  authorizeAdmin,
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
  body('type')
    .notEmpty()
    .isIn(['GENERAL', 'MATERNITY', 'PEDIATRIC', 'EMERGENCY', 'ICU', 'SURGERY'])
    .withMessage('Invalid ward type'),
  body('capacity')
    .isInt({ min: 0 })
    .withMessage('Capacity must be 0 or a positive integer'),
  body('description').optional().trim().isLength({ max: 255 }),
  validate,
  asyncHandler(async (req, res) => {
    const { name, type, capacity, description } = req.body
    const existing = await prisma.ward.findUnique({ where: { name } })
    if (existing) return sendError(res, 409, 'Ward with this name already exists')
    const ward = await prisma.ward.create({
      data: { name, type, capacity: Number(capacity), description: description || null },
      include: { _count: { select: { patients: true } } },
    })
    return sendSuccess(res, { ward: { ...ward, occupancy: ward._count.patients } }, 201)
  }),
]

/**
 * PUT /api/wards/:id
 * Admin only: update ward.
 */
const updateWard = [
  authenticate,
  authorizeAdmin,
  param('id').isInt().toInt(),
  body('name').optional().trim().isLength({ max: 80 }),
  body('type').optional().isIn(['GENERAL', 'MATERNITY', 'PEDIATRIC', 'EMERGENCY', 'ICU', 'SURGERY']),
  body('capacity').optional().isInt({ min: 0 }).withMessage('Capacity cannot be negative'),
  body('description').optional().trim().isLength({ max: 255 }),
  validate,
  asyncHandler(async (req, res) => {
    const id = req.params.id
    const existing = await prisma.ward.findUnique({ where: { id } })
    if (!existing) return sendError(res, 404, 'Ward not found')

    const { name, type, capacity, description } = req.body
    const data = {}
    if (name !== undefined) {
      const dup = await prisma.ward.findFirst({ where: { name, NOT: { id } } })
      if (dup) return sendError(res, 409, 'Ward with this name already exists')
      data.name = name
    }
    if (type !== undefined) data.type = type
    if (capacity !== undefined) data.capacity = Number(capacity)
    if (description !== undefined) data.description = description || null

    const ward = await prisma.ward.update({
      where: { id },
      data,
      include: { _count: { select: { patients: true } } },
    })
    return sendSuccess(res, { ward: { ...ward, occupancy: ward._count.patients } })
  }),
]

/**
 * DELETE /api/wards/:id
 * Admin only: delete ward. Cannot delete if patients are still assigned
 * (FK is SetNull so it would be allowed, but we reject to avoid orphaning).
 */
const deleteWard = [
  authenticate,
  authorizeAdmin,
  param('id').isInt().toInt(),
  validate,
  asyncHandler(async (req, res) => {
    const id = req.params.id
    const ward = await prisma.ward.findUnique({ where: { id }, include: { _count: { select: { patients: true } } } })
    if (!ward) return sendError(res, 404, 'Ward not found')
    if (ward._count.patients > 0) {
      return sendError(res, 400, 'Cannot delete ward with patients assigned. Remove or transfer patients first.')
    }
    await prisma.ward.delete({ where: { id } })
    return sendSuccess(res, { message: 'Ward deleted successfully' })
  }),
]

/**
 * POST /api/wards/:wardId/patients/:patientId
 * Admin only: assign a patient to a ward. Enforces capacity.
 * If patient is already in another ward, this acts as a transfer.
 */
const assignPatientToWard = [
  authenticate,
  authorizeAdmin,
  param('wardId').isInt().toInt(),
  param('patientId').isInt().toInt(),
  validate,
  asyncHandler(async (req, res) => {
    const wardId = req.params.wardId
    const patientId = req.params.patientId

    /*
     * Counting patients and then assigning them is two statements, so on their
     * own they could overbook a ward when two admins submit at the same time.
     * SERIALIZABLE isolation makes Postgres refuse the second, conflicting
     * transaction (Prisma error P2034), and we simply retry with fresh counts.
     */
    let result
    let attempt = 0
    while (true) {
      attempt += 1
      try {
        result = await prisma.$transaction(
          async (tx) => {
            const ward = await tx.ward.findUnique({
              where: { id: wardId },
              include: { _count: { select: { patients: true } } },
            })
            if (!ward) {
              const err = new Error('Ward not found')
              err.statusCode = 404
              throw err
            }

            const patient = await tx.patient.findUnique({ where: { id: patientId } })
            if (!patient) {
              const err = new Error('Patient not found')
              err.statusCode = 404
              throw err
            }

            // Already in this ward: nothing to do.
            if (patient.wardId === wardId) {
              return {
                message: 'Patient is already assigned to this ward',
                ward: { ...ward, occupancy: ward._count.patients },
                patient,
              }
            }

            if (ward._count.patients >= ward.capacity) {
              const err = new Error(
                `Ward is full. Capacity ${ward.capacity}, current occupancy ${ward._count.patients}`,
              )
              err.statusCode = 400
              throw err
            }

            const updatedPatient = await tx.patient.update({
              where: { id: patientId },
              data: { wardId },
              include: {
                ward: { select: { id: true, name: true, type: true, capacity: true } },
                user: { select: { fullName: true } },
              },
            })

            const updatedWard = await tx.ward.findUnique({
              where: { id: wardId },
              include: { _count: { select: { patients: true } } },
            })

            return {
              message: 'Patient assigned to ward successfully',
              patient: updatedPatient,
              ward: { ...updatedWard, occupancy: updatedWard._count.patients },
            }
          },
          { isolationLevel: 'Serializable' },
        )
        break
      } catch (error) {
        // Retry a couple of times on a serialization conflict, then give up.
        if (error.code !== 'P2034' || attempt >= 3) throw error
      }
    }

    return sendSuccess(res, result)
  }),
]

/**
 * DELETE /api/wards/:wardId/patients/:patientId
 * Admin only: remove a patient from a ward.
 */
const removePatientFromWard = [
  authenticate,
  authorizeAdmin,
  param('wardId').isInt().toInt(),
  param('patientId').isInt().toInt(),
  validate,
  asyncHandler(async (req, res) => {
    const wardId = req.params.wardId
    const patientId = req.params.patientId

    const patient = await prisma.patient.findUnique({ where: { id: patientId } })
    if (!patient) return sendError(res, 404, 'Patient not found')
    if (patient.wardId !== wardId) {
      return sendError(res, 400, 'Patient is not assigned to this ward')
    }

    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: { wardId: null },
      include: {
        user: { select: { fullName: true } },
      },
    })

    const ward = await prisma.ward.findUnique({
      where: { id: wardId },
      include: { _count: { select: { patients: true } } },
    })

    return sendSuccess(res, {
      message: 'Patient removed from ward successfully',
      patient: updatedPatient,
      ward: { ...ward, occupancy: ward._count.patients },
    })
  }),
]

module.exports = {
  listWards,
  getWardById,
  createWard,
  updateWard,
  deleteWard,
  assignPatientToWard,
  removePatientFromWard,
}