const { validationResult, body } = require('express-validator')
const prisma = require('../config/prisma')
const { hashPassword, comparePassword } = require('../utils/password')
const { signToken } = require('../utils/jwt')
const { sendSuccess, sendError } = require('../utils/response')
const { asyncHandler, validate } = require('../middleware/validate')
const { authenticate } = require('../middleware/auth')

/**
 * POST /api/auth/register
 *
 * Creates a new user with default role PATIENT. Never allows the caller to set
 * "role" to ADMIN. Password is hashed before storage. Returns safe user info
 * and a freshly signed JWT (common for single-page apps after registration).
 */
const register = [
  // Validation rules
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 120 })
    .withMessage('Full name must be between 2 and 120 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 5, max: 30 })
    .withMessage('Phone number is invalid'),

  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Address must be between 2 and 255 characters'),

  // Check validation result
  validate,

  asyncHandler(async (req, res) => {
    const { fullName, email, password, phone, address } = req.body

    // Enforce uniqueness. Return 409 if the email is already registered.
    const existing = await prisma.user.findUnique({
      where: { email },
    })
    if (existing) {
      return sendError(res, 409, 'Email is already registered')
    }

    // Hash password. Never store plain text.
    const hashedPassword = await hashPassword(password)

    // Create user with default role PATIENT. Explicitly ignore any role
    // provided in the body.
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        phone,
        address,
        role: 'PATIENT',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        createdAt: true,
      },
    })

    // Sign a token so the user can be logged in immediately.
    const token = signToken({ id: user.id, role: user.role })

    return sendSuccess(
      res,
      {
        token,
        user,
      },
      201,
    )
  }),
]

/**
 * POST /api/auth/login
 *
 * Looks up the user by email, compares bcrypt hashes, issues a JWT on success.
 * Uses 401 for any invalid credential to avoid leaking which part is wrong.
 */
const login = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  validate,

  asyncHandler(async (req, res) => {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return sendError(res, 401, 'Invalid email or password')
    }

    const isMatch = await comparePassword(password, user.password)
    if (!isMatch) {
      return sendError(res, 401, 'Invalid email or password')
    }

    const token = signToken({ id: user.id, role: user.role })

    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    })
  }),
]

/*
 * GET /api/auth/me
 *
 * Returns the account behind the current token, without the password hash.
 * Useful for a frontend that wants to confirm a stored token is still valid
 * after a page refresh, instead of trusting whatever is in localStorage.
 */
const getMe = [
  authenticate,
  asyncHandler(async (req, res) => sendSuccess(res, { user: req.user })),
]

module.exports = { register, login, getMe }