import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/*
 * A route guard.
 *
 * This exists for USER EXPERIENCE only: it stops a logged-out visitor from
 * seeing a dashboard they cannot use. It is NOT security. Anyone can bypass it
 * with the browser dev tools, so the real protection is `authenticate` and
 * `authorizeAdmin` on the backend, which reject unauthorised requests with
 * 401/403 no matter what the frontend does.
 */
export default function ProtectedRoute({ requireAdmin = false }) {
  const { isAuthenticated, isAdmin } = useAuth()
  const location = useLocation()

  // Not logged in: remember where they wanted to go, then send them to login.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // Logged in but in the wrong section (e.g. a patient opening /admin).
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/patient/dashboard" replace />
  }

  // <Outlet /> renders the child route that was matched.
  return <Outlet />
}