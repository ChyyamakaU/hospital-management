import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import * as orderService from '../../services/order.service'
import * as patientService from '../../services/patient.service'
import {
  ErrorAlert,
  SuccessAlert,
  EmptyState,
} from '../../components/common/Feedback'
import { formatMoney } from '../../utils/format'

/*
 * Checkout is a two-step flow:
 *   1. POST /api/patients/me  - confirm the patient profile exists.
 *   2. POST /api/orders        - send [{ medicineId, quantity }].
 *
 * Prices and totals shown here are for display only. The server rebuilds the
 * order from current medicine prices, checks stock in a transaction and
 * returns the real total, which is what we display after checkout.
 */
export default function Cart() {
  const navigate = useNavigate()
  const { items, itemCount, total, updateQuantity, removeItem, clearCart, toOrderItems } =
    useCart()

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleCheckout = async () => {
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      await patientService.getMyProfile()

      const order = await orderService.createOrder(toOrderItems())
      clearCart()
      setSuccess(
        `Order #${order.id} placed successfully. Total ${formatMoney(
          order.totalAmount,
        )}.`,
      )
      // Give the patient a moment to read the confirmation.
      window.setTimeout(() => navigate('/patient/orders'), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-ink-900">My Cart</h1>
        <EmptyState
          title="Your cart is empty"
          description="Add medicine from the pharmacy to start an order."
          action={
            <Link to="/pharmacy" className="btn-primary mt-2">
              Browse pharmacy
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">My Cart</h1>
        <p className="mt-1 text-sm text-ink-600">
          {itemCount} item{itemCount === 1 ? '' : 's'} ready to order.
        </p>
      </div>

      <ErrorAlert message={error} />
      <SuccessAlert message={success} />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card space-y-3 lg:col-span-2">
          {items.map((item) => (
            <article
              key={item.medicineId}
              className="flex flex-wrap items-center gap-4 border-b border-ink-100 pb-3 last:border-0 last:pb-0"
            >
              <div className="min-w-40 flex-1">
                <p className="font-semibold text-ink-900">{item.name}</p>
                <p className="text-xs text-ink-500">{item.category}</p>
                <p className="mt-1 text-sm text-ink-600">
                  {formatMoney(item.price)} each
                </p>
              </div>

              <div className="w-24">
                <label className="sr-only" htmlFor={`qty-${item.medicineId}`}>
                  Quantity for {item.name}
                </label>
                <input
                  id={`qty-${item.medicineId}`}
                  type="number"
                  min={1}
                  max={item.stockQuantity}
                  className="field-input"
                  value={item.quantity}
                  onChange={(event) =>
                    updateQuantity(item.medicineId, Number(event.target.value))
                  }
                />
                <p className="mt-1 text-xs text-ink-500">
                  Max {item.stockQuantity}
                </p>
              </div>

              <p className="w-28 text-right font-semibold text-ink-900">
                {formatMoney(item.price * item.quantity)}
              </p>

              <button
                type="button"
                onClick={() => removeItem(item.medicineId)}
                className="text-sm font-semibold text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </article>
          ))}
        </section>

        <aside className="card h-fit">
          <h2 className="text-lg font-semibold text-ink-900">Summary</h2>

          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-600">Items</dt>
              <dd className="font-medium text-ink-800">{itemCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-600">Estimated total</dt>
              <dd className="font-medium text-ink-800">
                {formatMoney(total)}
              </dd>
            </div>
          </dl>

          <p className="mt-3 text-xs text-ink-500">
            The final total is recalculated on the server using current
            medicine prices.
          </p>

          <button
            type="button"
            onClick={handleCheckout}
            disabled={submitting}
            className="btn-primary mt-4 w-full"
          >
            {submitting ? 'Placing order…' : 'Place order'}
          </button>
          <button
            type="button"
            onClick={clearCart}
            className="btn-secondary mt-2 w-full"
          >
            Clear cart
          </button>
        </aside>
      </div>
    </div>
  )
}