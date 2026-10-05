import { Outlet } from 'react-router-dom'
import Navbar from '../components/layout/Navbar.jsx'
import Footer from '../components/layout/Footer.jsx'

/*
 * A layout is just a component with an <Outlet /> in it.
 * Every child route rendered inside this layout appears in that <Outlet />.
 */
export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}