import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as medicineService from '../../services/medicine.service'
import { useCart } from '../../context/CartContext'
import {
  LoadingSpinner,
  ErrorAlert,
} from '../../components/common/Feedback'
import { formatMoney, formatDate, stockStyles } from '../../utils/format'

export default function MedicineDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()

  const [medicine, setMedicine] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    let cancelled = false

    medicineService
      .getMedicineById(id)
      .then((data) => {
        if (cancelled) return
        setMedicine(data)
        // Default to the smaller of 1 or the stock, so the input is always valid.
        setQuantity(data.stockQuantity > 0 ? 1 : 0)
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
  }, [id])

  if (loading) return <LoadingSpinner label="Loading medicine…" />

  if (error || !medicine) {
    return (
      <div className="space-y-4">
        <ErrorAlert message={error || 'Medicine not found'} />
        <Link to="/pharmacy" className="btn-secondary">
          Back to pharmacy
        </Link>
      </div>
    )
  }

  const outOfStock = medicine.stockQuantity <= 0
  const expired = new Date(medicine.expiryDate) < new Date()

  const handleAddToCart = () => {
    addItem(medicine, quantity)
    navigate('/cart')
  }

  return (
    <div className="space-y-6">
      <Link to="/pharmacy" className="text-sm font-semibold text-brand-700">
        ← Back to pharmacy
      </Link>

      <article className="card">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink-100 pb-4">
          <div>
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-700">
              {medicine.category}
            </span>
            <h1 className="mt-2 text-2xl font-bold text-ink-900">
              {medicine.name}
            </h1>
            <p className="mt-1 text-sm text-ink-600">
              {medicine.description || 'No description provided.'}
            </p>
          </div>

          <div className="text-right">
            <p className="text-3xl font-bold text-ink-900">
              {formatMoney(medicine.price)}
            </p>
            <p className={`text-sm ${stockStyles(medicine.stockQuantity)}`}>
              {outOfStock ? 'Out of stock' : `${medicine.stockQuantity} in stock`}
            </p>
          </div>
        </div>

        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-ink-500">Expiry date</dt>
            <dd
              className={`font-semibold ${
                expired ? 'text-red-600' : 'text-ink-800'
              }`}
            >
              {formatDate(medicine.expiryDate)}
              {expired ? ' (expired)' : ''}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-ink-500">Low stock alert at</dt>
            <dd className="font-semibold text-ink-800">
              {medicine.lowStockThreshold} units
            </dd>
          </div>
          <div>
            <dt className="text-sm text-ink-500">Availability</dt>
            <dd className="font-semibold text-ink-800">
              {outOfStock
                ? 'Currently unavailable'
                : expired
                  ? 'In stock but expired'
                  : 'Available to order'}
            </dd>
          </div>
        </dl>

        {!outOfStock && (
          <div className="mt-6 flex flex-wrap items-end gap-3 border-t border-ink-100 pt-4">
            <div className="w-28">
              <label className="field-label" htmlFor="quantity">
                Quantity
              </label>
              <input
                id="quantity"
                type="number"
                min={1}
                max={medicine.stockQuantity}
                className="field-input"
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    Math.max(
                      1,
                      Math.min(
                        Number(event.target.value) || 1,
                        medicine.stockQuantity,
                      ),
                    ),
                  )
                }
              />
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="btn-primary"
            >
              Add to cart
            </button>
            <Link to="/cart" className="btn-secondary">
              Go to cart
            </Link>

            <p className="text-sm text-ink-500">
              Subtotal:{' '}
              <span className="font-semibold text-ink-800">
                {formatMoney(Number(medicine.price) * quantity)}
              </span>
            </p>
          </div>
        )}
      </article>
    </div>
  )
}