import axios from 'axios'

/*
 * Every backend call in the app goes through this one file.
 *
 * Why centralise it?
 *  - The backend URL comes from a single environment variable (VITE_API_URL),
 *    so we never hardcode localhost into components.
 *  - The JWT is attached in one place (see Phase 3) instead of every component.
 *  - Errors are converted into a consistent shape for the UI to display.
 */

/*
 * In development VITE_API_URL is undefined, so we fall back to a relative
 * '/api' path. The Vite dev server proxies '/api' to the Express server on
 * port 5000 (see vite.config.js), which behaves exactly like a real remote API.
 */
const baseURL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Runs after every request succeeds.
api.interceptors.response.use(
  (response) => response,
  // Runs after every request fails, so pages can just use `error.message`.
  (error) => {
    const message =
      error.response?.data?.message ||
      (error.code === 'ERR_NETWORK'
        ? 'Cannot reach the server. Is the backend running on port 5000?'
        : error.message)

    return Promise.reject(new Error(message))
  },
)

/** Simple GET /api/health used on the home page to test connectivity. */
export async function getHealth() {
  const { data } = await api.get('/health')
  return data
}

export default api