import { Link, Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

/*
 * Patient section shell: sidebar navigation + the page itself.
 */
export default function PatientLayout() {
  const { user, logout } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()

  const links = [
    { to: '/patient/dashboard', label: 'Dashboard' },
    { to: '/patient/profile', label: 'My Profile' },
    { to: '/pharmacy', label: 'Pharmacy' },
    { to: '/cart', label: `Cart${itemCount > 0 ? ` (${itemCount})` : ''}` },
    { to: '/patient/orders', label: 'My Orders' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link to="/patient/dashboard" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-lg font-bold text-white">
              H
            </span>
            <span className="font-bold text-ink-900">Patient Portal</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ink-600 sm:inline">
              {user?.fullName}
            </span>
            <button type="button" onClick={handleLogout} className="btn-secondary">
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row">
        <nav className="md:w-56 md:shrink-0">
          <ul className="flex flex-wrap gap-2 md:flex-col">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive
                        ? 'bg-brand-600 text-white'
                        : 'bg-white text-ink-700 hover:bg-ink-100'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}