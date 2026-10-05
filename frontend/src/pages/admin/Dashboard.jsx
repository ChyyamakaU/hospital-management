import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as adminService from '../../services/admin.service'
import {
  LoadingSpinner,
  ErrorAlert,
  StatusBadge,
} from '../../components/common/Feedback'
import { formatMoney, formatDate } from '../../utils/format'
import StatCard from '../../components/ui/StatCard'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    adminService
      .getDashboard()
      .then((data) => {
        if (!cancelled) setStats(data)
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

  if (loading) return <LoadingSpinner label="Loading dashboard…" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-white/60">
          Hospital activity at a glance.
        </p>
      </div>

      <ErrorAlert message={error} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Patients"
          value={stats.stats.totalPatients}
          hint={`${stats.stats.totalUsers} registered users`}
        />
        <StatCard
          label="Wards"
          value={stats.stats.totalWards}
          tone="brand"
        />
        <StatCard
          label="Medicines"
          value={stats.stats.totalMedicines}
          hint={`${stats.stats.lowStockCount} low stock · ${stats.stats.expiredCount} expired`}
        />
        <StatCard
          label="Orders"
          value={stats.stats.totalOrders}
          tone="brand"
          hint={`${stats.stats.pendingOrders} awaiting processing`}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Low stock medicines"
          value={stats.lowStockMedicines.length}
          tone="warn"
          hint="At or below the low stock threshold"
        />
        <StatCard
          label="Expired medicines"
          value={stats.expiredMedicines.length}
          tone="danger"
          hint="Past the expiry date"
        />
        <StatCard
          label="Bed occupancy"
          value={`${stats.stats.bedOccupancy.occupied} / ${stats.stats.bedOccupancy.capacity}`}
          tone="brand"
          hint={`${stats.stats.bedOccupancy.available} beds free`}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold text-ink-900">
            Medicines needing attention
          </h2>

          {stats.lowStockMedicines.length === 0 &&
          stats.expiredMedicines.length === 0 ? (
            <p className="text-sm text-ink-500">
              All medicines are at healthy stock levels.
            </p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {stats.expiredMedicines.map((medicine) => (
                <li
                  key={`expired-${medicine.id}`}
                  className="flex items-center justify-between py-2"
                >
                  <p className="text-sm font-medium text-ink-800">
                    {medicine.name}
                  </p>
                  <p className="text-xs font-semibold text-red-600">
                    Expired {formatDate(medicine.expiryDate)}
                  </p>
                </li>
              ))}

              {stats.lowStockMedicines.map((medicine) => (
                <li
                  key={`low-${medicine.id}`}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-ink-800">
                      {medicine.name}
                    </p>
                    <p className="text-xs text-ink-500">{medicine.category}</p>
                  </div>
                  <p className="text-xs font-semibold text-amber-600">
                    {medicine.stockQuantity} left · alert at{' '}
                    {medicine.lowStockThreshold}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <Link
            to="/admin/pharmacy"
            className="mt-3 inline-block text-sm font-semibold text-brand-700"
          >
            Manage pharmacy →
          </Link>
        </div>

        <div className="card">
          <h2 className="mb-3 font-semibold text-ink-900">Recent orders</h2>

          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-ink-500">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {stats.recentOrders.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-ink-800">
                      Order #{order.id} · {order.patient.patientId}
                    </p>
                    <p className="text-xs text-ink-500">
                      {order.patient.user.fullName} ·{' '}
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

          <Link
            to="/admin/orders"
            className="mt-3 inline-block text-sm font-semibold text-brand-700"
          >
            All orders →
          </Link>
        </div>
      </section>

      <section className="card">
        <h2 className="mb-3 font-semibold text-ink-900">Recent patients</h2>

        {stats.recentPatients.length === 0 ? (
          <p className="text-sm text-ink-500">No patients registered.</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {stats.recentPatients.map((patient) => (
              <li
                key={patient.id}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <p className="text-sm font-medium text-ink-800">
                    {patient.user.fullName}
                  </p>
                  <p className="text-xs text-ink-500">
                    {patient.patientId} · registered{' '}
                    {formatDate(patient.registeredAt)}
                  </p>
                </div>
                <Link
                  to={`/admin/patients/${patient.id}`}
                  className="text-sm font-semibold text-brand-700"
                >
                  View →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}