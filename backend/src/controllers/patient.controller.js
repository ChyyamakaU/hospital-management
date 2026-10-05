const { body, param } = require('express-validator')
const prisma = require('../config/prisma')
const { sendSuccess, sendError } = require('../utils/response')
const { asyncHandler, validate } = require('../middleware/validate')
const { authenticate, authorizeAdmin } = require('../middleware/auth')

async function generatePatientId() {
  const latest = await prisma.patient.findFirst({
    select: { patientId: true },
    orderBy: { id: 'desc' },
  })
  let nextNumber = 1
  if (latest && latest.patientId) {
    const match = latest.patientId.match(/^PAT-(\d{1,6})$/i)
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1
    }
  }
  return `PAT-${String(nextNumber).padStart(6, '0')}`
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
    const patientId = await generatePatientId()
    const patient = await prisma.patient.create({
      data: { patientId, userId, dateOfBirth: new Date(dateOfBirth), gender, bloodGroup: bloodGroup || null, emergencyContact, emergencyPhone, registeredAt: new Date() },
      include: { user: { select: { id: true, fullName: true, email: true, phone: true, address: true, role: true } }, ward: { select: { id: true, name: true, type: true, capacity: true } } },
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
