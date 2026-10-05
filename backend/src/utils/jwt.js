/*
 * JWT helpers. Tokens are signed with the secret from config and include the
 * user's id and role. Only these two claims are stored: they are enough for
 * authorization checks and to look up the user if needed.
 */
const jwt = require('jsonwebtoken')
const config = require('../config')

const signToken = (payload) =>
  jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  })

const verifyToken = (token) => jwt.verify(token, config.jwtSecret)

module.exports = { signToken, verifyToken }