import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as medicineService from '../../services/medicine.service'
import {
  LoadingSpinner,
  ErrorAlert,
  SuccessAlert,
  EmptyState,
} from '../../components/common/Feedback'
import { formatMoney, formatDate } from '../../utils/format'

/*
 * Category is a free-text column in the database (not an enum), so this list
 * is only a convenience for the dropdown. It matches the values used by the
 * seed data; the API accepts any category up to 80 characters.
 */
const CATEGORIES = [
  'Analgesic',
  'Antibiotic',
  'Antihistamine',
  'Antidiabetic',
  'Electrolyte',
  'Supplement',
  'Controlled',
  'Cardiovascular',
  'Dermatology',
  'Ophthalmology',
  'Respiratory',
]

export default function AdminPharmacy() {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const loadMedicines = () => {
    setLoading(true)
    medicineService
      .listMedicines()
      .then(setMedicines)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(loadMedicines, [])

  const handleDelete = async (medicine) => {
    if (
      !window.confirm(
        `Delete "${medicine.name}"? Medicines referenced by past orders cannot be deleted.`,
      )
    ) {
      return
    }

    setError('')
    setSuccess('')
    try {
      await medicineService.deleteMedicine(medicine.id)
      setSuccess(`"${medicine.name}" deleted`)
      loadMedicines()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRestock = async (medicine) => {
    const amount = window.prompt(
      `How many units to add to "${medicine.name}"? Current stock: ${medicine.stockQuantity}`,
      '10',
    )
    if (amount === null) return

    const quantity = Number(amount)
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError('Enter a positive whole number')
      return
    }

    setError('')
    setSuccess('')
    try {
      await medicineService.updateMedicine(medicine.id, {
        stockQuantity: medicine.stockQuantity + quantity,
      })
      setSuccess(`Restocked ${quantity} units of "${medicine.name}"`)
      loadMedicines()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <LoadingSpinner label="Loading pharmacy inventory…" />

  const query = search.trim().toLowerCase()
  const visible = medicines.filter((medicine) => {
    const matchesSearch =
      query === '' || medicine.name.toLowerCase().includes(query)

    if (filter === 'low') return medicine.stockQuantity <= medicine.lowStockThreshold
    if (filter === 'out') return medicine.stockQuantity <= 0
    if (filter === 'expired') {
      return medicine.expiryDate && new Date(medicine.expiryDate) < new Date()
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Pharmacy</h1>
          <p className="mt-1 text-sm text-white/60">
            Manage medicine records, prices and stock.
          </p>
        </div>
        <Link to="/admin/pharmacy/new" className="btn-primary">
          Add medicine
        </Link>
      </div>

      <ErrorAlert message={error} />
      <SuccessAlert message={success} />

      <section className="card flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <label className="field-label" htmlFor="medicine-search">
            Search medicines
          </label>
          <input
            id="medicine-search"
            type="search"
            className="field-input"
            placeholder="Search by name…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="sm:w-56">
          <label className="field-label" htmlFor="stock-filter">
            Stock filter
          </label>
          <select
            id="stock-filter"
            className="field-input"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All medicines</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </section>

      {visible.length === 0 ? (
        <EmptyState
          title="No medicines found"
          description="Add a medicine or change the search and filter."
        />
      ) : (
        <section className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-500">
                <th className="py-2 font-medium">Name</th>
                <th className="py-2 font-medium">Category</th>
                <th className="py-2 font-medium">Price</th>
                <th className="py-2 font-medium">Stock</th>
                <th className="py-2 font-medium">Expiry</th>
                <th className="py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {visible.map((medicine) => {
                const expired =
                  medicine.expiryDate &&
                  new Date(medicine.expiryDate) < new Date()
                const low =
                  medicine.stockQuantity <= medicine.lowStockThreshold

                return (
                  <tr key={medicine.id}>
                    <td className="py-2 font-medium text-ink-900">
                      {medicine.name}
                    </td>
                    <td className="py-2 text-ink-600">{medicine.category}</td>
                    <td className="py-2 text-ink-700">
                      {formatMoney(medicine.price)}
                    </td>
                    <td className="py-2">
                      <span
                        className={`font-semibold ${
                          medicine.stockQuantity <= 0
                            ? 'text-red-600'
                            : low
                              ? 'text-amber-600'
                              : 'text-green-600'
                        }`}
                      >
                        {medicine.stockQuantity}
                      </span>
                      {low && (
                        <span className="ml-1 text-xs text-ink-500">
                          (alert ≤ {medicine.lowStockThreshold})
                        </span>
                      )}
                    </td>
                    <td className="py-2">
                      {medicine.expiryDate ? (
                        <span className={expired ? 'text-red-600' : 'text-ink-600'}>
                          {formatDate(medicine.expiryDate)}
                        </span>
                      ) : (
                        <span className="text-ink-500">—</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => handleRestock(medicine)}
                          className="font-semibold text-brand-700"
                        >
                          Restock
                        </button>
                        <Link
                          to={`/admin/pharmacy/${medicine.id}/edit`}
                          className="font-semibold text-ink-700"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(medicine)}
                          className="font-semibold text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}

export { CATEGORIES }