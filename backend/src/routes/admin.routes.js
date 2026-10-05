const express = require('express')
const { authenticate, authorizeAdmin } = require('../middleware/auth')
const { sendSuccess } = require('../utils/response')
const { asyncHandler } = require('../middleware/validate')

const router = express.Router()

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    sendSuccess(res, { user: req.user })
  }),
)

router.get(
  '/dashboard',
  authenticate,
  authorizeAdmin,
  asyncHandler(async (req, res) => {
    sendSuccess(res, {
      message: 'Admin dashboard access granted',
      user: req.user,
    })
  }),
)

module.exports = router