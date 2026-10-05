import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as authService from '../services/auth.service'

/*
 * AuthContext holds the logged-in user and the token for the whole app.
 *
 * Where the token lives:
 *   - localStorage so a page refresh keeps you logged in.
 *   - This is acceptable for a learning project. For anything handling real
 *     medical data you would use an httpOnly cookie instead, because
 *     localStorage is readable by any JavaScript on the page.
 */

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // When api.js gets a 401 it clears storage and fires this event. We log the
  // user out so protected pages redirect them to /login.
  useEffect(() => {
    const handleUnauthorised = () => setUser(null)
    window.addEventListener('auth:unauthorised', handleUnauthorised)
    return () =>
      window.removeEventListener('auth:unauthorised', handleUnauthorised)
  }, [])

  const persist = (token, userData) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const login = async (credentials) => {
    setLoading(true)
    try {
      const { token, user: userData } = await authService.login(credentials)
      persist(token, userData)
      return userData
    } finally {
      setLoading(false)
    }
  }

  const register = async (payload) => {
    setLoading(true)
    try {
      const { token, user: userData } = await authService.register(payload)
      persist(token, userData)
      return userData
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }

  const value = useMemo(
    () => ({
      user,
      token: localStorage.getItem('token'),
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'ADMIN',
      loading,
      login,
      register,
      logout,
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Hook so components can read auth state: const auth = useAuth() */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return context
}