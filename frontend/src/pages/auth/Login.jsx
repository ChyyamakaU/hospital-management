import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ErrorAlert } from '../../components/common/Feedback'

/*
 * POST /api/auth/login
 *
 * On success the AuthContext stores the token, and we send the user to the
 * dashboard for their role: admins to /admin/dashboard, patients to
 * /patient/dashboard.
 */

/*
 * A visitor who tried to open a protected page is remembered by the route
 * guard and sent here, and we honour that wish afterwards. We still check the
 * saved path against the role that just logged in: if an admin typed
 * /admin/wards while logged out and then signed in as a patient, following the
 * saved path blindly would only bounce them off an admin page a moment later.
 */
function canOpen(role, path) {
  if (path.startsWith('/admin')) return role === 'ADMIN'
  // Patient pages are open to any signed-in user, admin or not.
  if (path.startsWith('/patient')) return true
  return false
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const user = await login(form)
      const redirectTo = location.state?.from
      if (redirectTo && canOpen(user.role, redirectTo)) return navigate(redirectTo)
      return navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/patient/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="text-3xl font-bold text-ink-900">Welcome back</h1>
      <p className="mt-2 text-ink-600">Log in to your hospital account.</p>

      <form onSubmit={handleSubmit} className="card mt-8 space-y-4">
        <ErrorAlert message={error} />

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

        <div>
          <label className="field-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="field-input"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>

        <p className="text-center text-sm text-ink-600">
          No account yet?{' '}
          <Link to="/register" className="font-semibold text-brand-700">
            Register as a patient
          </Link>
        </p>
      </form>

      {/* <div className="card mt-4 bg-ink-100 text-xs text-ink-600">
        <p className="font-semibold text-ink-700">Development accounts</p>
        <p className="mt-1">admin@hospital.test / Admin@12345</p>
        <p>amina@patient.test / Admin@12345</p>
      </div> */}
    </div>
  )
}