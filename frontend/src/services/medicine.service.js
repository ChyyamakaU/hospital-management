import api from './api'

/* Medicine (pharmacy) endpoints. */

export async function listMedicines(params = {}) {
  const { data } = await api.get('/medicines', { params })
  return data.data.medicines
}

export async function getMedicineById(id) {
  const { data } = await api.get(`/medicines/${id}`)
  return data.data.medicine
}

export async function createMedicine(payload) {
  const { data } = await api.post('/medicines', payload)
  return data.data.medicine
}

export async function updateMedicine(id, payload) {
  const { data } = await api.put(`/medicines/${id}`, payload)
  return data.data.medicine
}

export async function deleteMedicine(id) {
  const { data } = await api.delete(`/medicines/${id}`)
  return data
}