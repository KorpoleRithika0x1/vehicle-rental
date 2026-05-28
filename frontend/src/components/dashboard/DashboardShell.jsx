import { BarChart2, Car, ClipboardList, LayoutDashboard, LogOut, Pencil, PlusSquare, ShieldCheck, Users } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import { uploadProfileImage } from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';

const LINK_ICONS = {
  '/dashboard/admin':            LayoutDashboard,
  '/dashboard/admin/users':      Users,
  '/dashboard/admin/managers':   Users,
  '/dashboard/admin/licenses':   ShieldCheck,
  '/dashboard/manager':          LayoutDashboard,
  '/dashboard/manager/vehicles/add': PlusSquare,
  '/dashboard/manager/vehicles': Car,
  '/dashboard/manager/bookings': ClipboardList,
  '/dashboard/customer':         LayoutDashboard,
  '/booking/history':            ClipboardList,
  '/dashboard/stats':            BarChart2,
};

export default function DashboardShell({ title, subtitle, links, children }) {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
  }

  async function handleProfileImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingProfileImage(true);
    try {
      const response = await uploadProfileImage(file);
      await updateProfile({ profile_image_url: response.image_url });
    } finally {
      setIsUploadingProfileImage(false);
      event.target.value = '';
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      {/* Top bar — full width */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-8 py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white">
            VR
          </div>
          <span className="text-lg font-bold text-brand">Veloce Rentals</span>
        </Link>
        <div className="text-sm text-slate-500">Welcome, {user?.name || 'User'}</div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex w-[260px] shrink-0 flex-col border-r border-slate-100 bg-white">
          {/* Avatar + name */}
          <div className="flex flex-col items-center px-6 pb-6 pt-8">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingProfileImage}
              className="group relative mb-4 block h-20 w-20 disabled:cursor-not-allowed"
              title="Update profile image"
            >
              {user?.profile_image_url ? (
                <img src={user.profile_image_url} alt="Profile" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand/10 text-3xl font-bold text-brand">
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 text-white opacity-0 transition group-hover:opacity-100">
                <Pencil className="h-4 w-4" />
              </span>
              {isUploadingProfileImage ? (
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-slate-500">Uploading...</span>
              ) : null}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfileImageChange} />
            </button>
            <span className="text-base font-semibold text-ink">{user?.name || 'User'}</span>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 pb-6">
            {links.map((link) => {
              const Icon = LINK_ICONS[link.to] || LayoutDashboard;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `group relative mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand/10 text-brand'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-l-full bg-brand" />
                      )}
                      <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-brand' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      {link.label}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom logout */}
          <div className="border-t border-slate-100 px-3 py-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main content */}
        <section className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8">
            {title ? (
              <header className="mb-4">
                <h1 className="text-2xl font-semibold text-ink">{title}</h1>
                {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
              </header>
            ) : null}
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
