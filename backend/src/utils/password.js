/*
 * Password helpers. Bcrypt is deliberately slow (cost 10) so brute force is
 * expensive. cost 10 is a reasonable balance for a learning project; in
 * production you'd bump it based on hardware.
 */
const bcrypt = require('bcryptjs')

const SALT_ROUNDS = 10

const hashPassword = async (plain) => bcrypt.hash(plain, SALT_ROUNDS)

const comparePassword = async (plain, hashed) => bcrypt.compare(plain, hashed)

module.exports = { hashPassword, comparePassword }