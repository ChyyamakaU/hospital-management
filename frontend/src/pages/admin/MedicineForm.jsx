import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as medicineService from '../../services/medicine.service'
import { CATEGORIES } from './Pharmacy'
import {
  LoadingSpinner,
  ErrorAlert,
} from '../../components/common/Feedback'

/*
 * One form for both create and edit.
 *
 * With no :id in the URL it creates a medicine; with /:id/edit it updates.
 * That keeps validation in one place instead of duplicating two similar forms.
 */
export default function MedicineForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'Analgesic',
    price: '',
    stockQuantity: '',
    lowStockThreshold: '10',
    expiryDate: '',
  })
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isEdit) return

    let cancelled = false
    medicineService
      .getMedicineById(id)
      .then((medicine) => {
        if (cancelled) return
        setForm({
          name: medicine.name,
          description: medicine.description || '',
          category: medicine.category,
          price: String(medicine.price),
          stockQuantity: String(medicine.stockQuantity),
          lowStockThreshold: String(medicine.lowStockThreshold),
          expiryDate: medicine.expiryDate
            ? medicine.expiryDate.slice(0, 10)
            : '',
        })
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
  }, [id, isEdit])

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)

    try {
      // Send only the fields this form owns. Prisma wants numbers, so convert
      // the string inputs the browser gives us.
      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        price: Number(form.price).toFixed(2),
        stockQuantity: Number(form.stockQuantity),
        lowStockThreshold: Number(form.lowStockThreshold),
      }

      // An empty date field means "no expiry date". Send undefined rather than
      // null so express-validator skips its date check instead of failing it.
      if (form.expiryDate) {
        payload.expiryDate = form.expiryDate
      } else if (isEdit) {
        payload.expiryDate = null
      }

      if (isEdit) {
        await medicineService.updateMedicine(id, payload)
      } else {
        await medicineService.createMedicine(payload)
      }

      navigate('/admin/pharmacy')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner label="Loading medicine…" />

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to="/admin/pharmacy" className="text-sm font-semibold text-brand-700">
        ← Back to pharmacy
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">
          {isEdit ? 'Edit medicine' : 'Add medicine'}
        </h1>
        <p className="mt-1 text-sm text-white/60">
          {isEdit
            ? 'Update the details below and save.'
            : 'Create a new medicine record for the pharmacy.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <ErrorAlert message={error} />

        <div>
          <label className="field-label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            className="field-input"
            value={form.name}
            onChange={handleChange}
            placeholder="Paracetamol 500mg"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={500}
            className="field-input"
            value={form.description}
            onChange={handleChange}
            placeholder="Pain relief and fever reduction"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              name="category"
              required
              className="field-input"
              value={form.category}
              onChange={handleChange}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="price">
              Price (KES)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min={0}
              step="0.01"
              required
              className="field-input"
              value={form.price}
              onChange={handleChange}
              placeholder="150.00"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="stockQuantity">
              Stock quantity
            </label>
            <input
              id="stockQuantity"
              name="stockQuantity"
              type="number"
              min={0}
              required
              className="field-input"
              value={form.stockQuantity}
              onChange={handleChange}
              placeholder="50"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="lowStockThreshold">
              Low stock alert level
            </label>
            <input
              id="lowStockThreshold"
              name="lowStockThreshold"
              type="number"
              min={0}
              required
              className="field-input"
              value={form.lowStockThreshold}
              onChange={handleChange}
              placeholder="10"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="expiryDate">
              Expiry date
            </label>
            <input
              id="expiryDate"
              name="expiryDate"
              type="date"
              className="field-input"
              value={form.expiryDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving
              ? 'Saving…'
              : isEdit
                ? 'Save changes'
                : 'Create medicine'}
          </button>
          <Link to="/admin/pharmacy" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}