const express = require('express')
const { register, login } = require('../controllers/auth.controller')
const { authenticate } = require('../middleware/auth')
const { sendSuccess } = require('../utils/response')
const { asyncHandler } = require('../middleware/validate')

const router = express.Router()

router.post('/register', register)
router.post('/login', login)

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    sendSuccess(res, { user: req.user })
  }),
)

module.exports = router