/*
 * Formatting helpers shared across pages.
 *
 * Prisma returns Decimal values for money as strings, so we always convert
 * with Number() before doing arithmetic, and format for display here.
 */

export const formatMoney = (amount) =>
  Number(amount ?? 0).toLocaleString('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
  })

export const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export const formatDateTime = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Small colour classes for order status badges. */
export const statusStyles = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

/** Extra styling when a medicine is low or out of stock. */
export const stockStyles = (quantity) => {
  if (quantity <= 0) return 'text-red-600 font-semibold'
  if (quantity <= 10) return 'text-amber-600 font-semibold'
  return 'text-green-600'
}