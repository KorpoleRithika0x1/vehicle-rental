import { useEffect } from 'react';
import { useLocation, useMatch } from 'react-router-dom';

import ErrorBoundary from './components/common/ErrorBoundary';
import Footer from './components/common/Footer';
import Modal from './components/common/Modal';
import Navbar from './components/layout/Navbar';
import ToastContainer from './components/common/ToastContainer';
import { useAuthStore } from './store/authStore';
import AppRouter from './router/AppRouter';

export default function App() {
  const location = useLocation();
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const isVehicleDetail = useMatch('/vehicles/:id');
  const isCustomer = user?.role === 'customer';

  const isDashboardRoute =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/customer/') ||
    (isVehicleDetail && isCustomer);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    function handleForcedLogout() {
      logout();
    }

    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, [logout]);

  return (
    <ErrorBoundary>
      <div className="app-shell min-h-screen">
        {!isDashboardRoute ? <Navbar /> : null}
        <main>
          <AppRouter />
        </main>
        {!isDashboardRoute ? <Footer /> : null}
        <ToastContainer />
        <Modal />
      </div>
    </ErrorBoundary>
  );
}
