import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';

import { fetchReviews } from '../../api/reviews';
import DashboardShell from '../../components/dashboard/DashboardShell';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';
import { CITIES } from '../../utils/cities';

const ADMIN_LINKS = [
  { label: 'Dashboard',             to: '/dashboard/admin',          end: true },
  { label: 'Manage Users',          to: '/dashboard/admin/users' },
  { label: 'Manage Managers',       to: '/dashboard/admin/managers' },
  { label: 'License Verifications', to: '/dashboard/admin/licenses' },
  { label: 'Reports',               to: '/dashboard/admin/reports' },
  { label: 'Reviews',               to: '/dashboard/admin/reviews' },
];

const MANAGER_LINKS = [
  { label: 'Dashboard',       to: '/dashboard/manager',              end: true },
  { label: 'Add Car',         to: '/dashboard/manager/vehicles/add', end: true },
  { label: 'Manage Cars',     to: '/dashboard/manager/vehicles',     end: true },
  { label: 'Manage Bookings', to: '/dashboard/manager/bookings' },
  { label: 'Reviews',         to: '/dashboard/manager/reviews' },
  { label: 'Update Profile',  to: '/dashboard/manager/profile' },
];

function StarDisplay({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-4 w-4 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const links = isAdmin ? ADMIN_LINKS : MANAGER_LINKS;

  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState('');

  async function load(city = '') {
    setIsLoading(true);
    try {
      const data = await fetchReviews(city ? { city } : {});
      setReviews(data);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(cityFilter); }, [cityFilter]);

  if (isLoading) return <Loader label="Loading reviews..." fullScreen />;

  return (
    <DashboardShell title="Customer Reviews" subtitle="Reviews from completed bookings." links={links}>
      <div className="mb-5 flex items-center gap-3">
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none"
        >
          <option value="">All Regions</option>
          {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-sm text-slate-400">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-[2rem] border border-slate-100 bg-white py-20 text-center">
          <p className="text-lg font-semibold text-slate-500">No reviews yet</p>
          <p className="mt-1 text-sm text-slate-400">Reviews from completed bookings will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{r.customer_name}</p>
                  <p className="text-xs text-slate-400">{r.vehicle_name} · {r.vehicle_city}</p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">#{r.booking_id}</span>
              </div>
              <div className="mt-3">
                <StarDisplay rating={r.rating} />
              </div>
              {r.title && <p className="mt-2 font-semibold text-sm text-ink">{r.title}</p>}
              {r.comment && <p className="mt-1 text-sm text-slate-500 leading-relaxed">{r.comment}</p>}
              <p className="mt-3 text-xs text-slate-300">{new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
