import { Menu, UserCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';
import { NAV_LINKS, ROLE_DASHBOARD_PATHS } from '../../utils/constants';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const dashboardPath = user ? ROLE_DASHBOARD_PATHS[user.role] : '/dashboard';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-lg font-bold text-white shadow-soft">
            VR
          </div>
          <div>
            <div className="font-heading text-xl text-ink">Veloce Rentals</div>
            <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Drive better</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-medium transition ${isActive ? 'text-brand' : 'text-slate-600 hover:text-brand'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link to={dashboardPath} className="rounded-full border border-brand/20 px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white">
                Dashboard
              </Link>
              <Link to="/profile" className="rounded-full bg-slate-100 p-2 text-slate-600 hover:text-brand">
                <UserCircle2 className="h-5 w-5" />
              </Link>
              <button type="button" onClick={handleLogout} className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-brand">
                Sign in
              </Link>
              <Link to="/register" className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-soft">
                Create account
              </Link>
            </div>
          )}
        </nav>

        <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-full bg-slate-100 p-2 text-slate-600 md:hidden">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {NAV_LINKS.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)} className="text-sm font-medium text-slate-600">
                {item.label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <>
                <Link to={dashboardPath} onClick={() => setOpen(false)} className="rounded-full border border-brand/20 px-4 py-2 text-center text-sm font-semibold text-brand">
                  Dashboard
                </Link>
                <button type="button" onClick={handleLogout} className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="rounded-full border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700">
                  Sign in
                </Link>
                <Link to="/register" onClick={() => setOpen(false)} className="rounded-full bg-brand px-4 py-2 text-center text-sm font-semibold text-white">
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
