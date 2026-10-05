import { useEffect, useState } from 'react'
import * as wardService from '../../services/ward.service'
import {
  LoadingSpinner,
  ErrorAlert,
  SuccessAlert,
  EmptyState,
} from '../../components/common/Feedback'

const WARD_TYPES = [
  'GENERAL',
  'MATERNITY',
  'PEDIATRIC',
  'EMERGENCY',
  'ICU',
  'SURGERY',
]

const emptyForm = {
  name: '',
  type: 'GENERAL',
  capacity: '',
  description: '',
}

export default function AdminWards() {
  const [wards, setWards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [expandedWard, setExpandedWard] = useState(null)
  const [wardPatients, setWardPatients] = useState([])
  const [detailLoading, setDetailLoading] = useState(false)

  const loadWards = () => {
    setLoading(true)
    wardService
      .listWards()
      .then(setWards)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(loadWards, [])

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (ward) => {
    setEditingId(ward.id)
    setForm({
      name: ward.name,
      type: ward.type,
      capacity: String(ward.capacity),
      description: ward.description || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      if (editingId) {
        await wardService.updateWard(editingId, form)
        setSuccess('Ward updated successfully')
      } else {
        await wardService.createWard(form)
        setSuccess('Ward created successfully')
      }
      setShowForm(false)
      loadWards()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (ward) => {
    if (
      !window.confirm(
        `Delete ward "${ward.name}"? This only works if no patients are assigned.`,
      )
    ) {
      return
    }

    setError('')
    setSuccess('')
    try {
      await wardService.deleteWard(ward.id)
      setSuccess('Ward deleted successfully')
      loadWards()
    } catch (err) {
      setError(err.message)
    }
  }

  // Ward detail includes the list of assigned patients.
  const togglePatients = async (ward) => {
    if (expandedWard === ward.id) {
      setExpandedWard(null)
      return
    }

    setExpandedWard(ward.id)
    setDetailLoading(true)
    try {
      const detail = await wardService.getWardById(ward.id)
      setWardPatients(detail.patients || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setDetailLoading(false)
    }
  }

  if (loading) return <LoadingSpinner label="Loading wards…" />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Wards</h1>
          <p className="mt-1 text-sm text-white/60">
            Create wards, watch occupancy and manage capacity.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary">
          Add ward
        </button>
      </div>

      <ErrorAlert message={error} />
      <SuccessAlert message={success} />

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="text-lg font-semibold text-ink-900">
            {editingId ? 'Edit ward' : 'New ward'}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="ward-name">
                Ward name
              </label>
              <input
                id="ward-name"
                name="name"
                required
                className="field-input"
                value={form.name}
                onChange={handleChange}
                placeholder="Male Ward A"
              />
            </div>

            <div>
              <label className="field-label" htmlFor="ward-type">
                Ward type
              </label>
              <select
                id="ward-type"
                name="type"
                required
                className="field-input"
                value={form.type}
                onChange={handleChange}
              >
                {WARD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label" htmlFor="ward-capacity">
                Capacity (beds)
              </label>
              <input
                id="ward-capacity"
                name="capacity"
                type="number"
                min={0}
                required
                className="field-input"
                value={form.capacity}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="ward-description">
                Description
              </label>
              <input
                id="ward-description"
                name="description"
                className="field-input"
                value={form.description}
                onChange={handleChange}
                placeholder="General male surgical ward"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create ward'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {wards.length === 0 ? (
        <EmptyState
          title="No wards yet"
          description="Create your first ward to start assigning patients."
        />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2">
          {wards.map((ward) => {
            const full = ward.occupancy >= ward.capacity
            const percent =
              ward.capacity > 0
                ? Math.round((ward.occupancy / ward.capacity) * 100)
                : 0

            return (
              <article key={ward.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-ink-900">{ward.name}</h2>
                    <p className="text-xs uppercase tracking-wide text-ink-500">
                      {ward.type}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      full
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {full ? 'Full' : `${ward.capacity - ward.occupancy} free`}
                  </span>
                </div>

                {ward.description && (
                  <p className="mt-2 text-sm text-ink-600">{ward.description}</p>
                )}

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-ink-600">
                    <span>
                      Occupancy {ward.occupancy}/{ward.capacity}
                    </span>
                    <span>{percent}%</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-ink-100">
                    <div
                      className={`h-2 rounded-full ${
                        full ? 'bg-red-500' : 'bg-brand-500'
                      }`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => togglePatients(ward)}
                    className="btn-secondary"
                  >
                    {expandedWard === ward.id
                      ? 'Hide patients'
                      : 'View patients'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(ward)}
                    className="btn-secondary"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(ward)}
                    className="text-sm font-semibold text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>

                {expandedWard === ward.id && (
                  <div className="mt-3 border-t border-ink-100 pt-3">
                    {detailLoading ? (
                      <p className="text-sm text-ink-500">Loading patients…</p>
                    ) : wardPatients.length === 0 ? (
                      <p className="text-sm text-ink-500">
                        No patients in this ward.
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {wardPatients.map((patient) => (
                          <li key={patient.id} className="text-sm text-ink-700">
                            {patient.user.fullName}{' '}
                            <span className="text-xs text-ink-500">
                              ({patient.patientId})
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </section>
      )}
    </div>
  )
}