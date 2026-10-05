import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as patientService from '../../services/patient.service'
import {
  LoadingSpinner,
  ErrorAlert,
  EmptyState,
} from '../../components/common/Feedback'
import { formatDate } from '../../utils/format'

export default function AdminPatients() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false

    patientService
      .getAllPatients()
      .then((data) => {
        if (!cancelled) setPatients(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <LoadingSpinner label="Loading patients…" />

  const visible = patients.filter((patient) => {
    const query = search.trim().toLowerCase()
    if (query === '') return true
    return (
      patient.patientId.toLowerCase().includes(query) ||
      patient.user.fullName.toLowerCase().includes(query) ||
      patient.user.email.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Patients</h1>
        <p className="mt-1 text-sm text-white/60">
          All registered patients and their ward assignments.
        </p>
      </div>

      <ErrorAlert message={error} />

      <section className="card">
        <label className="field-label" htmlFor="patient-search">
          Search patients
        </label>
        <input
          id="patient-search"
          type="search"
          className="field-input"
          placeholder="Search by patient ID, name or email…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </section>

      {visible.length === 0 ? (
        <EmptyState
          title="No patients found"
          description={
            patients.length === 0
              ? 'No patients have registered yet.'
              : 'No patient matches your search.'
          }
        />
      ) : (
        <section className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-500">
                <th className="py-2 font-medium">Patient ID</th>
                <th className="py-2 font-medium">Name</th>
                <th className="py-2 font-medium">Contact</th>
                <th className="py-2 font-medium">Gender</th>
                <th className="py-2 font-medium">Ward</th>
                <th className="py-2 font-medium">Registered</th>
                <th className="py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {visible.map((patient) => (
                <tr key={patient.id}>
                  <td className="py-2 font-semibold text-brand-700">
                    {patient.patientId}
                  </td>
                  <td className="py-2 font-medium text-ink-800">
                    {patient.user.fullName}
                  </td>
                  <td className="py-2 text-ink-600">
                    <p>{patient.user.email}</p>
                    <p className="text-xs">{patient.user.phone}</p>
                  </td>
                  <td className="py-2 text-ink-600">
                    {patient.gender.toLowerCase()}
                  </td>
                  <td className="py-2 text-ink-600">
                    {patient.ward?.name || 'Not assigned'}
                  </td>
                  <td className="py-2 text-ink-600">
                    {formatDate(patient.registeredAt)}
                  </td>
                  <td className="py-2 text-right">
                    <Link
                      to={`/admin/patients/${patient.id}`}
                      className="font-semibold text-brand-700"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}