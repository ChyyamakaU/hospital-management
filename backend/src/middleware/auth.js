/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const jwt = require('jsonwebtoken')
const prisma = require('../config/prisma')
const { verifyToken } = require('../utils/jwt')
const { sendError } = require('../utils/response')
const AppError = require('../utils/AppError')

/*
 * Reads `Authorization: Bearer <token>` and attaches `req.user` (id, fullName,
 * email, role, phone, address) to the request. It also loads the user record so
 * deleted accounts cannot keep using an old token, and so a role changed in the
 * database applies immediately instead of waiting for the token to expire.
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
    //
    // The role always comes from the database, never from the token, so
    // demoting someone takes effect on their very next request instead of
    // waiting for the old token to expire.
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        phone: true,
        address: true,
      },
    })

    if (!user) {
      return sendError(res, 401, 'Unauthorized: User not found')
    }

    // The password hash is deliberately not in the select above, so this
    // object is safe to attach to the request and return from /auth/me.
    req.user = user

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