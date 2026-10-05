const { body, param } = require('express-validator')
const prisma = require('../config/prisma')
const { sendSuccess, sendError } = require('../utils/response')
const { asyncHandler, validate } = require('../middleware/validate')
const { authenticate, authorizeAdmin } = require('../middleware/auth')

/**
 * Builds the next patient ID, e.g. PAT-000001, PAT-000002, ...
 *
 * Two details matter here:
 *
 * 1. We look at every existing patientId and take the highest NUMBER, rather
 *    than trusting the newest database row. Rows are not necessarily inserted
 *    in ID order (the seed creates them concurrently), so "last row" is not
 *    the same as "highest number" and would hand out a duplicate ID.
 *
 * 2. The read and the insert run inside one SERIALIZABLE transaction, so two
 *    people registering at the same moment cannot both compute the same
 *    number. If they still collide (Prisma P2002) or the transaction has to be
 *    retried (P2034), we try again with the fresh number.
 */
const PATIENT_ID_RETRIES = 3

function nextPatientIdFrom(patientIds) {
  let highest = 0
  for (const patientId of patientIds) {
    const match = /^PAT-(\d{1,6})$/i.exec(patientId || '')
    if (match) highest = Math.max(highest, parseInt(match[1], 10))
  }
  return `PAT-${String(highest + 1).padStart(6, '0')}`
}

async function createPatientWithId(userId, profileData) {
  let lastError = null

  for (let attempt = 1; attempt <= PATIENT_ID_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const existing = await tx.patient.findMany({
            select: { patientId: true },
          })
          const patientId = nextPatientIdFrom(existing.map((p) => p.patientId))

          return tx.patient.create({
            data: { patientId, userId, ...profileData },
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phone: true,
                  address: true,
                  role: true,
                },
              },
              ward: { select: { id: true, name: true, type: true, capacity: true } },
            },
          })
        },
        { isolationLevel: 'Serializable' },
      )
    } catch (error) {
      // P2002 = another request took this patientId, P2034 = the serializable
      // transaction was aborted. Both are safe to retry with a fresh number.
      lastError = error
      const retryable = error.code === 'P2002' || error.code === 'P2034'
      if (!retryable || attempt === PATIENT_ID_RETRIES) throw error
    }
  }

  throw lastError
}

const createPatientProfile = [
  authenticate,
  body('dateOfBirth').notEmpty().withMessage('Date of birth is required').isISO8601(),
  body('gender').notEmpty().isIn(['MALE', 'FEMALE', 'OTHER']),
  body('bloodGroup').optional().trim().isLength({ max: 5 }),
  body('emergencyContact').trim().notEmpty().isLength({ min: 2, max: 120 }),
  body('emergencyPhone').trim().notEmpty().isLength({ min: 5, max: 30 }),
  validate,
  asyncHandler(async (req, res) => {
    const userId = req.user.id
    const existing = await prisma.patient.findUnique({ where: { userId } })
    if (existing) return sendError(res, 409, 'Patient profile already exists')

    const { dateOfBirth, gender, bloodGroup, emergencyContact, emergencyPhone } = req.body

    const patient = await createPatientWithId(userId, {
      dateOfBirth: new Date(dateOfBirth),
      gender,
      bloodGroup: bloodGroup || null,
      emergencyContact,
      emergencyPhone,
      registeredAt: new Date(),
    })

    return sendSuccess(res, { patient }, 201)
  }),
]

const getMyProfile = [
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user.id
    const patient = await prisma.patient.findUnique({ where: { userId }, include: { user: { select: { id: true, fullName: true, email: true, phone: true, address: true, role: true } }, ward: { select: { id: true, name: true, type: true, capacity: true } } } })
    if (!patient) return sendError(res, 404, 'Patient profile not found. Please create one.')
    return sendSuccess(res, { patient })
  }),
]

const updateMyProfile = [
  authenticate,
  body('dateOfBirth').optional().isISO8601(),
  body('gender').optional().isIn(['MALE', 'FEMALE', 'OTHER']),
  body('bloodGroup').optional().trim().isLength({ max: 5 }),
  body('emergencyContact').optional().trim().isLength({ min: 2, max: 120 }),
  body('emergencyPhone').optional().trim().isLength({ min: 5, max: 30 }),
  validate,
  asyncHandler(async (req, res) => {
    const userId = req.user.id
    const existing = await prisma.patient.findUnique({ where: { userId } })
    if (!existing) return sendError(res, 404, 'Patient profile not found. Please create one.')
    const { dateOfBirth, gender, bloodGroup, emergencyContact, emergencyPhone } = req.body
    const data = {}
    if (dateOfBirth) data.dateOfBirth = new Date(dateOfBirth)
    if (gender) data.gender = gender
    if (bloodGroup !== undefined) data.bloodGroup = bloodGroup || null
    if (emergencyContact) data.emergencyContact = emergencyContact
    if (emergencyPhone) data.emergencyPhone = emergencyPhone
    const patient = await prisma.patient.update({ where: { userId }, data, include: { user: { select: { id: true, fullName: true, email: true, phone: true, address: true, role: true } }, ward: { select: { id: true, name: true, type: true, capacity: true } } } })
    return sendSuccess(res, { patient })
  }),
]

const getAllPatients = [
  authenticate,
  authorizeAdmin,
  asyncHandler(async (req, res) => {
    const patients = await prisma.patient.findMany({ include: { user: { select: { id: true, fullName: true, email: true, phone: true, address: true, role: true } }, ward: { select: { id: true, name: true, type: true, capacity: true } } }, orderBy: { id: 'asc' } })
    return sendSuccess(res, { patients })
  }),
]

const getPatientById = [
  authenticate,
  param('id').isInt().toInt(),
  validate,
  asyncHandler(async (req, res) => {
    const id = req.params.id
    const patient = await prisma.patient.findUnique({ where: { id }, include: { user: { select: { id: true, fullName: true, email: true, phone: true, address: true, role: true } }, ward: { select: { id: true, name: true, type: true, capacity: true } } } })
    if (!patient) return sendError(res, 404, 'Patient not found')
    if (req.user.role !== 'ADMIN' && req.user.id !== patient.userId) return sendError(res, 403, 'Forbidden: You can only view your own patient profile')
    return sendSuccess(res, { patient })
  }),
]

module.exports = { createPatientProfile, getMyProfile, updateMyProfile, getAllPatients, getPatientById }
