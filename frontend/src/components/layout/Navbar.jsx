import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <header className="border-b border-ink-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-lg text-white">
            H
          </span>
          <span className="text-lg font-bold text-ink-900">
            Hospital Management
          </span>
        </Link>

        {/* Authenticated links are added in Phase 3 once we know the user. */}
        <div className="flex items-center gap-2">
          <Link to="/login" className="btn-secondary">
            Login
          </Link>
          <Link to="/register" className="btn-primary">
            Register
          </Link>
        </div>
      </nav>
    </header>
  )
}