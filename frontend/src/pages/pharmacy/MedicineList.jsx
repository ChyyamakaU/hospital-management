import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as medicineService from '../../services/medicine.service'
import { useCart } from '../../context/CartContext'
import {
  LoadingSpinner,
  ErrorAlert,
  EmptyState,
} from '../../components/common/Feedback'
import { formatMoney, stockStyles } from '../../utils/format'

export default function MedicineList() {
  const { addItem } = useCart()
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [added, setAdded] = useState(null)

  useEffect(() => {
    let cancelled = false

    medicineService
      .listMedicines()
      .then((data) => {
        if (!cancelled) setMedicines(data)
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

  // Filter in the browser. The API also supports ?q= and ?category= for when
  // the list grows large enough that server-side filtering is worth it.
  const categories = [...new Set(medicines.map((m) => m.category))].sort()

  const visible = medicines.filter((medicine) => {
    const matchesSearch =
      search.trim() === '' ||
      medicine.name.toLowerCase().includes(search.toLowerCase()) ||
      (medicine.description || '')
        .toLowerCase()
        .includes(search.toLowerCase())

    const matchesCategory =
      category === '' || medicine.category === category

    return matchesSearch && matchesCategory
  })

  const handleAdd = (medicine) => {
    addItem(medicine, 1)
    setAdded(medicine.id)
    // Clear the "added" tick after a moment.
    window.setTimeout(() => setAdded(null), 1500)
  }

  if (loading) return <LoadingSpinner label="Loading medicines…" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Pharmacy</h1>
        <p className="mt-1 text-sm text-ink-600">
          Browse available medicine. Prices and stock are shown live.
        </p>
      </div>

      <ErrorAlert message={error} />

      {/* Search + category filter */}
      <section className="card flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <label className="field-label" htmlFor="search">
            Search medicines
          </label>
          <input
            id="search"
            type="search"
            className="field-input"
            placeholder="Search by name or description…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="sm:w-56">
          <label className="field-label" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            className="field-input"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </section>

      {visible.length === 0 ? (
        <EmptyState
          title="No medicines match your search"
          description="Try a different search term or clear the category filter."
        />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((medicine) => {
            const outOfStock = medicine.stockQuantity <= 0

            return (
              <article key={medicine.id} className="card flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-ink-900">
                    {medicine.name}
                  </h2>
                  <span className="shrink-0 rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-700">
                    {medicine.category}
                  </span>
                </div>

                <p className="mt-2 flex-1 text-sm text-ink-600">
                  {medicine.description || 'No description provided.'}
                </p>

                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-xl font-bold text-ink-900">
                      {formatMoney(medicine.price)}
                    </p>
                    <p className={`text-xs ${stockStyles(medicine.stockQuantity)}`}>
                      {outOfStock
                        ? 'Out of stock'
                        : `${medicine.stockQuantity} in stock`}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    to={`/pharmacy/${medicine.id}`}
                    className="btn-secondary flex-1"
                  >
                    Details
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleAdd(medicine)}
                    disabled={outOfStock}
                    className="btn-primary flex-1"
                  >
                    {outOfStock
                      ? 'Unavailable'
                      : added === medicine.id
                        ? 'Added ✓'
                        : 'Add to cart'}
                  </button>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </div>
  )
}