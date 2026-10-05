import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as orderService from '../../services/order.service'
import {
  LoadingSpinner,
  ErrorAlert,
  EmptyState,
  StatusBadge,
} from '../../components/common/Feedback'
import { formatMoney, formatDateTime } from '../../utils/format'

export default function MyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    orderService
      .getMyOrders()
      .then((data) => {
        if (!cancelled) setOrders(data)
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

  if (loading) return <LoadingSpinner label="Loading your orders…" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">My Orders</h1>
        <p className="mt-1 text-sm text-ink-600">
          Every medicine order you have placed, newest first.
        </p>
      </div>

      <ErrorAlert message={error} />

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="When you buy medicine from the pharmacy it will appear here with its status."
          action={
            <Link to="/pharmacy" className="btn-primary mt-2">
              Browse pharmacy
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 pb-3">
                <div>
                  <h2 className="font-semibold text-ink-900">
                    Order #{order.id}
                  </h2>
                  <p className="text-xs text-ink-500">
                    Placed {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <p className="text-lg font-bold text-ink-900">
                    {formatMoney(order.totalAmount)}
                  </p>
                </div>
              </div>

              <table className="mt-3 w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-ink-500">
                    <th className="py-2 font-medium">Medicine</th>
                    <th className="py-2 font-medium">Category</th>
                    <th className="py-2 font-medium">Qty</th>
                    <th className="py-2 font-medium">Unit price</th>
                    <th className="py-2 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 font-medium text-ink-800">
                        {item.medicine.name}
                      </td>
                      <td className="py-2 text-ink-600">
                        {item.medicine.category}
                      </td>
                      <td className="py-2 text-ink-600">{item.quantity}</td>
                      <td className="py-2 text-ink-600">
                        {formatMoney(item.unitPrice)}
                      </td>
                      <td className="py-2 text-right font-medium text-ink-800">
                        {formatMoney(
                          Number(item.unitPrice) * item.quantity,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}