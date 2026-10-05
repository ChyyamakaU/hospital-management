import { Link, Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/*
 * Admin section shell. Only rendered behind <ProtectedRoute requireAdmin />,
 * so a patient never reaches it from the UI.
 */
export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const links = [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/patients', label: 'Patients' },
    { to: '/admin/wards', label: 'Wards' },
    { to: '/admin/pharmacy', label: 'Pharmacy' },
    { to: '/admin/orders', label: 'Orders' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-ink-900 text-white">
      <header className="border-b border-white/10 bg-ink-800">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 text-lg font-bold">
              H
            </span>
            <span className="font-bold">Admin Console</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-white/70 sm:inline">
              {user?.fullName} ({user?.role})
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row">
        <nav className="md:w-52 md:shrink-0">
          <ul className="flex flex-wrap gap-2 md:flex-col">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive
                        ? 'bg-brand-600 text-white'
                        : 'bg-white/5 text-white/80 hover:bg-white/10'
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