import api from './api'

/* Admin-only dashboard statistics. */

export async function getDashboard() {
  const { data } = await api.get('/admin/dashboard')
  return data.data
}