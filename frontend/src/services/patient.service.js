import api from './api'

/* Patient profile endpoints. */

export async function createPatientProfile(payload) {
  const { data } = await api.post('/patients', payload)
  return data.data.patient
}

export async function getMyProfile() {
  const { data } = await api.get('/patients/me')
  return data.data.patient
}

export async function updateMyProfile(payload) {
  const { data } = await api.put('/patients/me', payload)
  return data.data.patient
}

export async function getAllPatients() {
  const { data } = await api.get('/patients')
  return data.data.patients
}

export async function getPatientById(id) {
  const { data } = await api.get(`/patients/${id}`)
  return data.data.patient
}