import api from './api'

/*
 * All authentication calls.
 *
 * The backend responds with:
 *   { success: true, data: { token, user } }
 * or
 *   { success: false, message: "..." }
 *
 * The interceptor in api.js already turns failures into an Error carrying a
 * readable message, so callers only need a try/catch.
 */

export async function register(payload) {
  const { data } = await api.post('/auth/register', payload)
  return data.data // { token, user }
}

export async function login(payload) {
  const { data } = await api.post('/auth/login', payload)
  return data.data
}

export async function getMe() {
  const { data } = await api.get('/auth/me')
  return data.data
}