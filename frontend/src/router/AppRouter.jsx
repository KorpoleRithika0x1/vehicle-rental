import { Suspense, lazy } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';

import Loader from '../components/common/Loader';
import { useAuth } from '../hooks/useAuth';
import { ROLE_DASHBOARD_PATHS } from '../utils/constants';


const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const VehicleList = lazy(() => import('../pages/vehicles/VehicleList'));
const VehicleDetail = lazy(() => import('../pages/vehicles/VehicleDetail'));
const BookingConfirm = lazy(() => import('../pages/booking/BookingConfirm'));
const BookingHistory = lazy(() => import('../pages/booking/BookingHistory'));
const CustomerDashboard = lazy(() => import('../pages/dashboard/CustomerDashboard'));
const ManagerDashboard = lazy(() => import('../pages/dashboard/ManagerDashboard'));
const AdminDashboard = lazy(() => import('../pages/dashboard/AdminDashboard'));
const ManagerVehicles = lazy(() => import('../pages/dashboard/ManagerVehicles'));
const ManagerBookings = lazy(() => import('../pages/dashboard/ManagerBookings'));
const AdminUsers = lazy(() => import('../pages/dashboard/AdminUsers'));
const Profile = lazy(() => import('../pages/Profile'));
const Forbidden = lazy(() => import('../pages/Forbidden'));
const NotFound = lazy(() => import('../pages/NotFound'));

function ProtectedRoute() {
  const { isAuthenticated, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return <Loader label="Restoring session..." fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

function RoleGuard({ roles }) {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return <Loader label="Checking access..." fullScreen />;
  }

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}

function DashboardRedirect() {
  const { user, isReady } = useAuth();
  if (!isReady) return <Loader label="Preparing dashboard..." fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_DASHBOARD_PATHS[user.role]} replace />;
}

export default function AppRouter() {
  return (
    <Suspense fallback={<Loader label="Loading route..." fullScreen />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/vehicles" element={<VehicleList />} />
        <Route path="/vehicles/:id" element={<VehicleDetail />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/booking/history" element={<BookingHistory />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />

          <Route element={<RoleGuard roles={['customer']} />}>
            <Route path="/vehicles/:id/book" element={<BookingConfirm />} />
            <Route path="/dashboard/customer" element={<CustomerDashboard />} />
          </Route>

          <Route element={<RoleGuard roles={['vehicle_manager']} />}>
            <Route path="/dashboard/manager" element={<ManagerDashboard />} />
            <Route path="/dashboard/manager/vehicles" element={<ManagerVehicles />} />
            <Route path="/dashboard/manager/bookings" element={<ManagerBookings />} />
          </Route>

          <Route element={<RoleGuard roles={['admin']} />}>
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/dashboard/admin/users" element={<AdminUsers />} />
          </Route>
        </Route>

        <Route path="/403" element={<Forbidden />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
