import { Link } from 'react-router-dom'

export default function NotFound({ title = 'Page not found' }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <h1 className="text-3xl font-bold text-ink-900">{title}</h1>
      <p className="mt-3 text-ink-600">
        This page has not been built yet, or the link is incorrect.
      </p>
      <Link to="/" className="btn-primary mt-6">
        Back to home
      </Link>
    </div>
  )
}