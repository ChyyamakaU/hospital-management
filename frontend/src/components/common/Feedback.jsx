export function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      <p className="text-sm text-ink-500">{label}</p>
    </div>
  )
}

export function ErrorAlert({ message }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      {message}
    </div>
  )
}

export function SuccessAlert({ message }) {
  if (!message) return null
  return (
    <div
      role="status"
      className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
    >
      {message}
    </div>
  )
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="card flex flex-col items-center gap-2 py-12 text-center">
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      {description && <p className="max-w-md text-sm text-ink-600">{description}</p>}
      {action}
    </div>
  )
}

/** Coloured pill for order status. */
export function StatusBadge({ status }) {
  const styles = {
    PENDING: 'bg-amber-100 text-amber-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[status] || 'bg-ink-100 text-ink-700'
      }`}
    >
      {status}
    </span>
  )
}