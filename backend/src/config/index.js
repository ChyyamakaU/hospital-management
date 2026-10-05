/*
 * Central place for configuration and environment variables.
 *
 * Every other file imports from here instead of touching process.env directly,
 * so we always know where each setting comes from.
 */

require('dotenv').config()

// Fail loudly and early if a secret is missing. A weak JWT_SECRET in
// production would let anyone forge a valid admin token, so we refuse to boot.
if (!process.env.JWT_SECRET) {
  throw new Error(
    'JWT_SECRET is missing. Copy .env.example to .env and set a long random value.',
  )
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  /*
   * Comma-separated list of allowed frontend origins.
   * CORS is "allow who is on this list" rather than "allow everyone", which is
   * what requirement 27 asks for.
   */
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
}

module.exports = config