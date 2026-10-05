import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ErrorAlert } from '../../components/common/Feedback'

/*
 * POST /api/auth/register
 *
 * Every new account is created with the PATIENT role on the server. There is
 * deliberately no "role" field on this form: a user cannot sign themselves up
 * as an admin even by tampering with the request body, because the backend
 * hardcodes the role.
 */
export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      // Send only the five fields the API accepts. confirmPassword is a
      // frontend-only check, so it never leaves the browser.
      const { fullName, email, password, phone, address } = form
      await register({ fullName, email, password, phone, address })
      navigate('/patient/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col px-4 py-16">
      <h1 className="text-3xl font-bold text-ink-900">Create your account</h1>
      <p className="mt-2 text-ink-600">
        Register as a patient to access the pharmacy and your orders.
      </p>

      <form onSubmit={handleSubmit} className="card mt-8 space-y-4">
        <ErrorAlert message={error} />

        <div>
          <label className="field-label" htmlFor="fullName">
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            required
            className="field-input"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Amina Yusuf"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="field-input"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="field-input"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="confirmPassword">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="field-input"
              value={form.confirmPassword}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="phone">
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            required
            className="field-input"
            value={form.phone}
            onChange={handleChange}
            placeholder="+254700000000"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="address">
            Address
          </label>
          <textarea
            id="address"
            name="address"
            required
            rows={2}
            className="field-input"
            value={form.address}
            onChange={handleChange}
            placeholder="12 Kenyatta Avenue, Nairobi"
          />
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Creating account…' : 'Register'}
        </button>

        <p className="text-center text-sm text-ink-600">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-brand-700">
            Log in
          </Link>
        </p>
      </form>
    </div>
  )
}