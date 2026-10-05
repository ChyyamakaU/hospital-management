import { Routes, Route } from 'react-router-dom'

import MainLayout from './layouts/MainLayout.jsx'
import Home from './pages/shared/Home.jsx'
import NotFound from './pages/shared/NotFound.jsx'

/*
 * App.jsx holds the URL map of the whole application.
 *
 * <Route path="..." element={...} /> connects a URL to a React page component.
 * We use "layout routes" (routes that contain <Outlet />) so pages share the
 * same navbar/footer without repeating them in every page.
 */
export default function App() {
  return (
    <Routes>
      {/* Public pages: the navbar and footer are shared by MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />

        {/* Placeholder route so /login has something to render in Phase 1.
            It is replaced by the real Login page in Phase 3. */}
        <Route path="/login" element={<NotFound title="Coming in Phase 3" />} />
        <Route path="/register" element={<NotFound title="Coming in Phase 3" />} />
      </Route>

      {/* Anything we do not recognise */}
      <Route path="*" element={<NotFound title="Page not found" />} />
    </Routes>
  )
}