export default function StatCard({ label, value, hint, tone = 'default' }) {
  const tones = {
    default: 'border-ink-200',
    brand: 'border-brand-200',
    warn: 'border-amber-200',
    danger: 'border-red-200',
  }

  return (
    <article className={`card border ${tones[tone]}`}>
      <p className="text-sm font-medium text-ink-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-ink-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </article>
  )
}