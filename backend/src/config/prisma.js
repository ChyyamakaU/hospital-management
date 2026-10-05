/*
 * Prisma client setup.
 *
 * We create the client once and reuse it. Creating a new client on every
 * request would open a new database connection pool each time and quickly
 * exhaust PostgreSQL's connection limit.
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
})

module.exports = prisma