import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as patientService from '../../services/patient.service'
import * as wardService from '../../services/ward.service'
import * as orderService from '../../services/order.service'
import {
  LoadingSpinner,
  ErrorAlert,
  SuccessAlert,
} from '../../components/common/Feedback'
import { formatMoney, formatDate, formatDateTime } from '../../utils/format'

/*
 * Admin view of a single patient: their record, ward assignment controls and
 * their order history.
 */
export default function AdminPatientDetails() {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [wards, setWards] = useState([])
  const [orders, setOrders] = useState([])
  const [targetWard, setTargetWard] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const patientData = await patientService.getPatientById(id)
        if (cancelled) return

        setPatient(patientData)
        setTargetWard(patientData.wardId ? String(patientData.wardId) : '')

        // Ward list and this patient's orders are supporting data, so a failure
        // there should not block the page from rendering.
        const [wardData, orderData] = await Promise.all([
          wardService.listWards().catch(() => []),
          orderService.getAllOrders().catch(() => []),
        ])
        if (cancelled) return

        setWards(wardData)
        setOrders(orderData.filter((order) => order.patientId === patientData.id))
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  const handleAssign = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      if (targetWard) {
        // Service signature is (wardId, patientId).
        const result = await wardService.assignPatientToWard(
          Number(targetWard),
          id,
        )
        setPatient(result.patient)
        setSuccess(result.message)
      } else if (patient.wardId) {
        // The endpoint needs the ward the patient is currently in.
        const result = await wardService.removePatientFromWard(
          patient.wardId,
          id,
        )
        setPatient(result.patient)
        setSuccess(result.message)
      } else {
        setSuccess('Patient is already not assigned to any ward')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner label="Loading patient…" />

  if (error && !patient) {
    return (
      <div className="space-y-4">
        <ErrorAlert message={error} />
        <Link to="/admin/patients" className="btn-secondary">
          Back to patients
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link to="/admin/patients" className="text-sm font-semibold text-brand-700">
        ← Back to patients
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">{patient.user.fullName}</h1>
        <p className="mt-1 text-sm text-white/60">
          {patient.patientId} · registered {formatDate(patient.registeredAt)}
        </p>
      </div>

      <ErrorAlert message={error} />
      <SuccessAlert message={success} />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold text-ink-900">Patient record</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-ink-500">Email</dt>
              <dd className="text-sm font-medium text-ink-800">
                {patient.user.email}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-ink-500">Phone</dt>
              <dd className="text-sm font-medium text-ink-800">
                {patient.user.phone}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-ink-500">Address</dt>
              <dd className="text-sm font-medium text-ink-800">
                {patient.user.address}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-ink-500">Date of birth</dt>
              <dd className="text-sm font-medium text-ink-800">
                {formatDate(patient.dateOfBirth)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-ink-500">Gender</dt>
              <dd className="text-sm font-medium text-ink-800">
                {patient.gender.toLowerCase()}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-ink-500">Blood group</dt>
              <dd className="text-sm font-medium text-ink-800">
                {patient.bloodGroup || 'Not recorded'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-ink-500">Emergency contact</dt>
              <dd className="text-sm font-medium text-ink-800">
                {patient.emergencyContact}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-ink-500">Emergency phone</dt>
              <dd className="text-sm font-medium text-ink-800">
                {patient.emergencyPhone}
              </dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <h2 className="font-semibold text-ink-900">Ward assignment</h2>
          <p className="mt-1 text-sm text-ink-600">
            Current ward:{' '}
            <span className="font-semibold text-ink-800">
              {patient.ward?.name || 'Not assigned'}
            </span>
          </p>

          <form onSubmit={handleAssign} className="mt-4 space-y-3">
            <div>
              <label className="field-label" htmlFor="ward">
                Ward
              </label>
              <select
                id="ward"
                className="field-input"
                value={targetWard}
                onChange={(event) => setTargetWard(event.target.value)}
              >
                <option value="">No ward (remove patient)</option>
                {wards.map((ward) => (
                  <option key={ward.id} value={ward.id}>
                    {ward.name} ({ward.occupancy}/{ward.capacity})
                    {ward.occupancy >= ward.capacity ? ' - full' : ''}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Save assignment'}
            </button>
          </form>
        </div>
      </section>

      <section className="card">
        <h2 className="font-semibold text-ink-900">Order history</h2>

        {orders.length === 0 ? (
          <p className="mt-2 text-sm text-ink-500">
            This patient has not placed any orders.
          </p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-ink-500">
                <th className="py-2 font-medium">Order</th>
                <th className="py-2 font-medium">Placed</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="py-2 font-medium text-ink-800">
                    #{order.id}
                  </td>
                  <td className="py-2 text-ink-600">
                    {formatDateTime(order.createdAt)}
                  </td>
                  <td className="py-2 text-ink-600">{order.status}</td>
                  <td className="py-2 text-right font-semibold text-ink-900">
                    {formatMoney(order.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}