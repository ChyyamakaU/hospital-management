import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { isAuthenticated, isAdmin } = useAuth()

  return (
    <header className="border-b border-ink-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-lg font-bold text-white">
            H
          </span>
          <span className="text-lg font-bold text-ink-900">
            Hospital Management
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link
              to={isAdmin ? '/admin/dashboard' : '/patient/dashboard'}
              className="btn-primary"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">
                Login
              </Link>
              <Link to="/register" className="btn-primary">
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}