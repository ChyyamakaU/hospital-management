/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const jwt = require('jsonwebtoken')
const prisma = require('../config/prisma')
const { verifyToken } = require('../utils/jwt')
const { sendError } = require('../utils/response')
const AppError = require('../utils/AppError')

/*
 * Reads `Authorization: Bearer <token>` and attaches `req.user = { id, role }`
 * to the request. Also loads the user record so deleted accounts cannot use an
 * old token (an extra safety check).
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization') || req.header('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Unauthorized: Bearer token required')
    }

    const token = authHeader.replace('Bearer ', '').trim()

    let decoded
    try {
      decoded = verifyToken(token)
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return sendError(res, 401, 'Unauthorized: Token expired')
      }
      if (error.name === 'JsonWebTokenError') {
        return sendError(res, 401, 'Unauthorized: Invalid token')
      }
      throw error
    }

    // decoded contains { id, role, iat, exp }
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, email: true },
    })

    if (!user) {
      return sendError(res, 401, 'Unauthorized: User not found')
    }

    // Attach the minimal user object the rest of the app needs.
    req.user = { id: user.id, role: user.role }

    return next()
  } catch (error) {
    return next(error)
  }
}

/*
 * Must run AFTER authenticate. Only users with ADMIN role may proceed.
 */
const authorizeAdmin = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized: Please log in')
  }

  if (req.user.role !== 'ADMIN') {
    return sendError(res, 403, 'Forbidden: Admin access required')
  }

  return next()
}

module.exports = { authenticate, authorizeAdmin }