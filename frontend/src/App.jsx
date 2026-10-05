import { Routes, Route } from 'react-router-dom'

import MainLayout from './layouts/MainLayout.jsx'
import PatientLayout from './layouts/PatientLayout.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'
import ProtectedRoute from './components/common/ProtectedRoute.jsx'

import Home from './pages/shared/Home.jsx'
import NotFound from './pages/shared/NotFound.jsx'
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'

import PatientDashboard from './pages/patient/Dashboard.jsx'
import PatientProfile from './pages/patient/Profile.jsx'
import MyOrders from './pages/patient/MyOrders.jsx'

import MedicineList from './pages/pharmacy/MedicineList.jsx'
import MedicineDetails from './pages/pharmacy/MedicineDetails.jsx'
import Cart from './pages/pharmacy/Cart.jsx'

import AdminDashboard from './pages/admin/Dashboard.jsx'
import AdminPatients from './pages/admin/Patients.jsx'
import AdminPatientDetails from './pages/admin/PatientDetails.jsx'
import AdminWards from './pages/admin/Wards.jsx'
import AdminPharmacy from './pages/admin/Pharmacy.jsx'
import MedicineForm from './pages/admin/MedicineForm.jsx'
import AdminOrders from './pages/admin/Orders.jsx'

/*
 * The URL map of the whole application.
 *
 * <Route element={<ProtectedRoute />}> wraps a group of routes. Any child
 * route inside it requires a logged-in user; adding requireAdmin additionally
 * requires the ADMIN role. See ProtectedRoute for why this is a convenience
 * rather than the real security boundary.
 */
export default function App() {
  return (
    <Routes>
      {/* ---------- Public ---------- */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* ---------- Patient section (any logged-in user) ---------- */}
      <Route element={<ProtectedRoute />}>
        <Route element={<PatientLayout />}>
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/patient/profile" element={<PatientProfile />} />
          <Route path="/patient/orders" element={<MyOrders />} />
          <Route path="/pharmacy" element={<MedicineList />} />
          <Route path="/pharmacy/:id" element={<MedicineDetails />} />
          <Route path="/cart" element={<Cart />} />
        </Route>
      </Route>

      {/* ---------- Admin section (admin only) ---------- */}
      <Route element={<ProtectedRoute requireAdmin />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/patients" element={<AdminPatients />} />
          <Route path="/admin/patients/:id" element={<AdminPatientDetails />} />
          <Route path="/admin/wards" element={<AdminWards />} />
          <Route path="/admin/pharmacy" element={<AdminPharmacy />} />
          <Route path="/admin/pharmacy/new" element={<MedicineForm />} />
          <Route path="/admin/pharmacy/:id/edit" element={<MedicineForm />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}