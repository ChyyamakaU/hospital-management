import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import * as patientService from '../../services/patient.service'
import * as orderService from '../../services/order.service'
import * as medicineService from '../../services/medicine.service'
import {
  LoadingSpinner,
  ErrorAlert,
  EmptyState,
  StatusBadge,
} from '../../components/common/Feedback'
import { formatMoney, formatDate } from '../../utils/format'

export default function PatientDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [orders, setOrders] = useState([])
  const [medicines, setMedicines] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        // The profile comes first because it decides what else exists. Asking
        // for orders before we know there is a profile would only produce a
        // 404, so we fetch the profile, then the independent calls together.
        const profileData = await patientService.getMyProfile()
        if (cancelled) return
        setProfile(profileData)

        const [orderData, medicineData] = await Promise.all([
          orderService.getMyOrders().catch(() => []),
          medicineService.listMedicines({ inStock: 'true' }).catch(() => []),
        ])

        if (cancelled) return
        setOrders(orderData)
        setMedicines(medicineData)
      } catch (err) {
        // A 404 here just means the patient has no profile yet, which the UI
        // handles with a prompt rather than an error.
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

  if (loading) return <LoadingSpinner label="Loading your dashboard…" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">
          Welcome, {user?.fullName}
        </h1>
        <p className="mt-1 text-sm text-ink-600">
          Here is your patient overview for today.
        </p>
      </div>

      <ErrorAlert message={error} />

      {/* Requirement 20: prompt clearly if no patient profile exists yet. */}
      {!profile ? (
        <EmptyState
          title="Complete your patient registration"
          description="You have a login account but no patient profile yet. Creating one gives you a patient ID and lets you order medicine."
          action={
            <Link to="/patient/profile" className="btn-primary mt-2">
              Complete registration
            </Link>
          }
        />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="card">
              <p className="text-sm text-ink-500">Patient ID</p>
              <p className="mt-1 text-xl font-bold text-brand-700">
                {profile.patientId}
              </p>
            </article>
            <article className="card">
              <p className="text-sm text-ink-500">Phone</p>
              <p className="mt-1 text-sm font-semibold text-ink-800">
                {profile.user.phone}
              </p>
            </article>
            <article className="card">
              <p className="text-sm text-ink-500">Assigned ward</p>
              <p className="mt-1 text-sm font-semibold text-ink-800">
                {profile.ward?.name || 'Not assigned'}
              </p>
            </article>
            <article className="card">
              <p className="text-sm text-ink-500">Registered</p>
              <p className="mt-1 text-sm font-semibold text-ink-800">
                {formatDate(profile.registeredAt)}
              </p>
            </article>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            {/* Recent orders */}
            <div className="card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink-900">
                  Recent orders
                </h2>
                <Link
                  to="/patient/orders"
                  className="text-sm font-semibold text-brand-700"
                >
                  View all
                </Link>
              </div>

              {orders.length === 0 ? (
                <p className="text-sm text-ink-500">No orders yet.</p>
              ) : (
                <ul className="divide-y divide-ink-100">
                  {orders.slice(0, 4).map((order) => (
                    <li
                      key={order.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink-800">
                          Order #{order.id}
                        </p>
                        <p className="text-xs text-ink-500">
                          {order.items.length} item
                          {order.items.length === 1 ? '' : 's'} ·{' '}
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-ink-900">
                          {formatMoney(order.totalAmount)}
                        </p>
                        <StatusBadge status={order.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* In-stock medicines */}
            <div className="card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink-900">
                  Medicines in stock
                </h2>
                <Link
                  to="/pharmacy"
                  className="text-sm font-semibold text-brand-700"
                >
                  Go to pharmacy
                </Link>
              </div>

              <ul className="divide-y divide-ink-100">
                {medicines.slice(0, 5).map((medicine) => (
                  <li
                    key={medicine.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink-800">
                        {medicine.name}
                      </p>
                      <p className="text-xs text-ink-500">
                        {medicine.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-ink-900">
                        {formatMoney(medicine.price)}
                      </p>
                      <p className="text-xs text-ink-500">
                        {medicine.stockQuantity} left
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="flex flex-wrap gap-3">
            <Link to="/pharmacy" className="btn-primary">
              Browse pharmacy
            </Link>
            <Link to="/patient/orders" className="btn-secondary">
              My orders
            </Link>
            <Link to="/patient/profile" className="btn-secondary">
              My profile
            </Link>
          </section>
        </>
      )}
    </div>
  )
}