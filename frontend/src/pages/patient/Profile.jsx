import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import * as patientService from '../../services/patient.service'
import {
  LoadingSpinner,
  ErrorAlert,
  SuccessAlert,
} from '../../components/common/Feedback'
import { formatDate } from '../../utils/format'

/*
 * Patient profile: creates the profile on first visit (which generates the
 * PAT-XXXXXX id on the server) and edits it afterwards.
 */
export default function PatientProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    dateOfBirth: '',
    gender: 'FEMALE',
    bloodGroup: '',
    emergencyContact: '',
    emergencyPhone: '',
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await patientService.getMyProfile()
        if (cancelled) return
        setProfile(data)
        setForm({
          dateOfBirth: (data.dateOfBirth || '').slice(0, 10),
          gender: data.gender,
          bloodGroup: data.bloodGroup || '',
          emergencyContact: data.emergencyContact,
          emergencyPhone: data.emergencyPhone,
        })
      } catch (err) {
        // No profile yet: leave the form in "create" mode instead of erroring.
        if (!cancelled && !err.message.includes('not found')) {
          setError(err.message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      // POST creates (and generates the patient ID), PUT updates.
      const saved = profile
        ? await patientService.updateMyProfile(form)
        : await patientService.createPatientProfile(form)

      setProfile(saved)
      setSuccess(
        profile
          ? 'Profile updated successfully'
          : `Profile created. Your patient ID is ${saved.patientId}`,
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner label="Loading your profile…" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">My Profile</h1>
        <p className="mt-1 text-sm text-ink-600">
          {profile
            ? 'Your patient record. Update your contact details below.'
            : 'Create your patient record to unlock ordering medicine.'}
        </p>
      </div>

      <ErrorAlert message={error} />
      <SuccessAlert message={success} />

      {profile && (
        <section className="card grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-ink-500">Patient ID</p>
            <p className="text-lg font-bold text-brand-700">
              {profile.patientId}
            </p>
          </div>
          <div>
            <p className="text-sm text-ink-500">Full name</p>
            <p className="font-semibold text-ink-800">{profile.user.fullName}</p>
          </div>
          <div>
            <p className="text-sm text-ink-500">Registered on</p>
            <p className="font-semibold text-ink-800">
              {formatDate(profile.registeredAt)}
            </p>
          </div>
          <div>
            <p className="text-sm text-ink-500">Assigned ward</p>
            <p className="font-semibold text-ink-800">
              {profile.ward?.name || 'Not assigned'}
            </p>
          </div>
          <div>
            <p className="text-sm text-ink-500">Email</p>
            <p className="font-semibold text-ink-800">{profile.user.email}</p>
          </div>
          <div>
            <p className="text-sm text-ink-500">Phone</p>
            <p className="font-semibold text-ink-800">{profile.user.phone}</p>
          </div>
        </section>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <h2 className="text-lg font-semibold text-ink-900">
          {profile ? 'Update details' : 'Patient details'}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="dateOfBirth">
              Date of birth
            </label>
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              required
              className="field-input"
              value={form.dateOfBirth}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="gender">
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              required
              className="field-input"
              value={form.gender}
              onChange={handleChange}
            >
              <option value="FEMALE">Female</option>
              <option value="MALE">Male</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="bloodGroup">
              Blood group (optional)
            </label>
            <input
              id="bloodGroup"
              name="bloodGroup"
              className="field-input"
              value={form.bloodGroup}
              onChange={handleChange}
              placeholder="O+"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="emergencyPhone">
              Emergency phone
            </label>
            <input
              id="emergencyPhone"
              name="emergencyPhone"
              required
              className="field-input"
              value={form.emergencyPhone}
              onChange={handleChange}
              placeholder="+254700000000"
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="emergencyContact">
            Emergency contact name
          </label>
          <input
            id="emergencyContact"
            name="emergencyContact"
            required
            className="field-input"
            value={form.emergencyContact}
            onChange={handleChange}
            placeholder="Joseph Yusuf"
          />
        </div>

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting
            ? 'Saving…'
            : profile
              ? 'Update profile'
              : 'Create patient profile'}
        </button>

        <p className="text-xs text-ink-500">
          Signed in as {user?.email}. Contact details for the login account are
          managed separately from your patient record.
        </p>
      </form>
    </div>
  )
}