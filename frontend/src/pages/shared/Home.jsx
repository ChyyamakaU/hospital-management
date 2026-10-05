import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHealth } from '../../services/api.js'

export default function Home() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    // Try to talk to the backend. If this says "connected", the frontend
    // and backend are wired up correctly.
    getHealth()
      .then((data) => setHealth(data))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <section className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
          Phase 1 &mdash; Project setup complete
        </p>
        <h1 className="mt-3 text-4xl font-bold text-ink-900 sm:text-5xl">
          Hospital Management System
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-600">
          Patients register online, pharmacy orders are tracked, and hospital
          staff manage wards, medicines and orders from one place.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/register" className="btn-primary">
            Create an account
          </Link>
          <Link to="/login" className="btn-secondary">
            Login
          </Link>
        </div>
      </section>

      <section className="mt-14 grid gap-6 md:grid-cols-3">
        <article className="card">
          <h2 className="text-lg font-semibold text-ink-900">Patient Portal</h2>
          <p className="mt-2 text-sm text-ink-600">
            Register a patient profile, browse the pharmacy, manage a cart and
            follow your order history.
          </p>
        </article>

        <article className="card">
          <h2 className="text-lg font-semibold text-ink-900">Pharmacy</h2>
          <p className="mt-2 text-sm text-ink-600">
            Search medicines by category, check price and stock, then purchase
            with stock checked again on the server.
          </p>
        </article>

        <article className="card">
          <h2 className="text-lg font-semibold text-ink-900">Admin Area</h2>
          <p className="mt-2 text-sm text-ink-600">
            Dashboard statistics, ward management, medicine inventory and order
            processing &mdash; restricted to admin accounts.
          </p>
        </article>
      </section>

      <section className="card mt-10">
        <h2 className="text-lg font-semibold text-ink-900">
          Frontend &harr; Backend connection
        </h2>
        <p className="mt-2 text-sm text-ink-600">
          This box calls <code>GET /api/health</code> on the Express backend. It
          is the quickest way to confirm both servers are running.
        </p>

        <div className="mt-4">
          {health ? (
            <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
              Connected to the backend: {health.message}
            </p>
          ) : error ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              Could not reach the backend: {error}
            </p>
          ) : (
            <p className="rounded-lg bg-ink-100 px-4 py-3 text-sm font-medium text-ink-600">
              Checking the backend&hellip;
            </p>
          )}
        </div>
      </section>
    </div>
  )
}