import { useEffect } from 'react';

import ErrorBoundary from './components/common/ErrorBoundary';
import Footer from './components/common/Footer';
import Modal from './components/common/Modal';
import Navbar from './components/common/Navbar';
import ToastContainer from './components/common/ToastContainer';
import { useAuthStore } from './store/authStore';
import AppRouter from './router/AppRouter';

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const logout = useAuthStore((state) => state.logout);

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
        <Navbar />
        <main>
          <AppRouter />
        </main>
        <Footer />
        <ToastContainer />
        <Modal />
      </div>
    </ErrorBoundary>
  );
}
