import {
  BarChart2,
  CalendarCheck,
  Car,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Pencil,
  PlusSquare,
  ShieldCheck,
  UserCircle,
  Users,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const LINK_ICONS = {
  '/dashboard/admin': LayoutDashboard,
  '/dashboard/admin/users': Users,
  '/dashboard/admin/managers': Users,
  '/dashboard/admin/licenses': ShieldCheck,
  '/dashboard/manager': LayoutDashboard,
  '/dashboard/manager/vehicles/add': PlusSquare,
  '/dashboard/manager/vehicles': Car,
  '/dashboard/manager/bookings': ClipboardList,
  '/dashboard/manager/profile': UserCircle,
  '/dashboard/customer': LayoutDashboard,
  '/customer/dashboard': LayoutDashboard,
  '/customer/vehicles': Car,
  '/vehicles': Car,
  '/customer/bookings': CalendarCheck,
  '/customer/history': History,
  '/customer/profile': UserCircle,
  '/booking/history': ClipboardList,
  '/dashboard/stats': BarChart2,
  '/profile': UserCircle,
};

const ROLE_DEFAULT_LINKS = {
  customer: [
    { label: 'Dashboard',       to: '/customer/dashboard',  end: true },
    { label: 'Browse Vehicles', to: '/customer/vehicles' },
    { label: 'My Bookings',     to: '/customer/bookings' },
    { label: 'Update Profile',  to: '/customer/profile' },
  ],
  vehicle_manager: [
    { label: 'Dashboard',       to: '/dashboard/manager',               end: true },
    { label: 'Add Car',         to: '/dashboard/manager/vehicles/add',  end: true },
    { label: 'Manage Cars',     to: '/dashboard/manager/vehicles',      end: true },
    { label: 'Manage Bookings', to: '/dashboard/manager/bookings' },
    { label: 'Update Profile',  to: '/dashboard/manager/profile' },
  ],
  admin: [
    { label: 'Dashboard',             to: '/dashboard/admin',          end: true },
    { label: 'Manage Users',          to: '/dashboard/admin/users' },
    { label: 'Manage Managers',       to: '/dashboard/admin/managers' },
    { label: 'License Verifications', to: '/dashboard/admin/licenses' },
  ],
};

export default function Sidebar({
  role,
  user,
  links,
  onLogout,
  onProfileImageChange,
  isUploadingProfileImage = false,
  fileInputRef,
}) {
  const navLinks = links?.length ? links : ROLE_DEFAULT_LINKS[role] || [];

  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-slate-100 bg-white">
      {/* Profile section */}
      <div className="flex flex-col items-center border-b border-slate-100 px-6 pb-6 pt-8">
        <button
          type="button"
          onClick={() => fileInputRef?.current?.click()}
          disabled={!onProfileImageChange || isUploadingProfileImage}
          className="group relative mb-4 block h-24 w-24 rounded-full disabled:cursor-default"
          title={onProfileImageChange ? 'Update profile image' : undefined}
        >
          <span className="block h-24 w-24 overflow-hidden rounded-full ring-2 ring-brand/20">
            {user?.profile_image_url ? (
              <img src={user.profile_image_url} alt="Profile" className="h-full w-full rounded-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center rounded-full bg-brand/10 text-3xl font-bold text-brand">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </span>
          {onProfileImageChange && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 text-white opacity-0 transition group-hover:opacity-100">
              <Pencil className="h-4 w-4" />
            </span>
          )}
          {isUploadingProfileImage && (
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-slate-500">Uploading...</span>
          )}
          {onProfileImageChange && (
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onProfileImageChange} />
          )}
        </button>
        <span className="text-base font-semibold text-ink">{user?.name || 'User'}</span>
        <span className="mt-0.5 text-xs capitalize text-slate-400">{user?.role?.replace('_', ' ') || ''}</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navLinks.map((link) => {
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
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand" />
                  )}
                  <Icon
                    className={`h-5 w-5 shrink-0 ${
                      isActive ? 'text-brand' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  {link.label}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 px-3 py-4">
        <button
          type="button"
          onClick={onLogout}
          className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:text-rose-600" />
          Logout
        </button>
      </div>
    </aside>
  );
}
