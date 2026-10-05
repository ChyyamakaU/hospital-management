import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as orderService from '../../services/order.service'
import {
  LoadingSpinner,
  ErrorAlert,
  SuccessAlert,
  EmptyState,
  StatusBadge,
} from '../../components/common/Feedback'
import { formatMoney, formatDateTime } from '../../utils/format'

const STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [updatingId, setUpdatingId] = useState(null)

  const loadOrders = () => {
    setLoading(true)
    orderService
      .getAllOrders()
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(loadOrders, [])

  const handleStatusChange = async (order, status) => {
    if (status === order.status) return

    setError('')
    setSuccess('')
    setUpdatingId(order.id)

    try {
      const updated = await orderService.updateOrderStatus(order.id, status)
      // Replace just this order in the list instead of refetching everything.
      setOrders((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      setSuccess(`Order #${order.id} marked as ${status}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) return <LoadingSpinner label="Loading orders…" />

  const visible =
    statusFilter === 'ALL'
      ? orders
      : orders.filter((order) => order.status === statusFilter)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Orders</h1>
        <p className="mt-1 text-sm text-white/60">
          Process pharmacy orders and update their status.
        </p>
      </div>

      <ErrorAlert message={error} />
      <SuccessAlert message={success} />

      <section className="card flex flex-wrap gap-2">
        {['ALL', ...STATUSES].map((status) => {
          const count =
            status === 'ALL'
              ? orders.length
              : orders.filter((order) => order.status === status).length

          return (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                statusFilter === status
                  ? 'bg-brand-600 text-white'
                  : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
              }`}
            >
              {status} ({count})
            </button>
          )
        })}
      </section>

      {visible.length === 0 ? (
        <EmptyState
          title="No orders"
          description={
            orders.length === 0
              ? 'No patient has placed an order yet.'
              : `No ${statusFilter.toLowerCase()} orders.`
          }
        />
      ) : (
        <div className="space-y-4">
          {visible.map((order) => (
            <article key={order.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 pb-3">
                <div>
                  <h2 className="font-semibold text-ink-900">
                    Order #{order.id}
                  </h2>
                  <p className="text-xs text-ink-500">
                    {order.patient.user.fullName} ·{' '}
                    <Link
                      to={`/admin/patients/${order.patient.id}`}
                      className="font-semibold text-brand-700"
                    >
                      {order.patient.patientId}
                    </Link>{' '}
                    · {formatDateTime(order.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <p className="text-lg font-bold text-ink-900">
                    {formatMoney(order.totalAmount)}
                  </p>
                </div>
              </div>

              <ul className="mt-3 space-y-1 text-sm">
                {order.items.map((item) => (
                  <li key={item.id} className="text-ink-700">
                    {item.quantity} × {item.medicine.name}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
                <label className="text-sm text-ink-600" htmlFor={`status-${order.id}`}>
                  Update status
                </label>
                <select
                  id={`status-${order.id}`}
                  className="field-input w-48"
                  value={order.status}
                  disabled={updatingId === order.id}
                  onChange={(event) =>
                    handleStatusChange(order, event.target.value)
                  }
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                {updatingId === order.id && (
                  <span className="text-sm text-ink-500">Saving…</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}