import api from './api'

/* Ward endpoints, including patient assignment and transfer. */

export async function listWards() {
  const { data } = await api.get('/wards')
  return data.data.wards
}

export async function getWardById(id) {
  const { data } = await api.get(`/wards/${id}`)
  return data.data.ward
}

export async function createWard(payload) {
  const { data } = await api.post('/wards', payload)
  return data.data.ward
}

export async function updateWard(id, payload) {
  const { data } = await api.put(`/wards/${id}`, payload)
  return data.data.ward
}

export async function deleteWard(id) {
  const { data } = await api.delete(`/wards/${id}`)
  return data
}

export async function assignPatientToWard(wardId, patientId) {
  const { data } = await api.post(`/wards/${wardId}/patients/${patientId}`)
  return data.data
}

export async function removePatientFromWard(wardId, patientId) {
  const { data } = await api.delete(`/wards/${wardId}/patients/${patientId}`)
  return data.data
}