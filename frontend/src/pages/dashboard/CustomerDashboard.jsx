import { CarFront, CircleDollarSign, Clock3, Receipt } from 'lucide-react';
import { useEffect, useState } from 'react';

import { fetchCustomerStats } from '../../api/stats';
import BookingTable from '../../components/dashboard/BookingTable';
import DashboardShell from '../../components/dashboard/DashboardShell';
import QuickActions from '../../components/dashboard/QuickActions';
import StatCard from '../../components/dashboard/StatCard';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';
import { useBooking } from '../../hooks/useBooking';
import { formatCurrency } from '../../utils/formatCurrency';

export const CUSTOMER_LINKS = [
  { label: 'Dashboard',       to: '/customer/dashboard',  end: true },
  { label: 'Browse Vehicles', to: '/customer/vehicles' },
  { label: 'My Bookings',     to: '/customer/bookings' },
  { label: 'Profile',         to: '/customer/profile' },
];

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { bookings, fetchHistory } = useBooking();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      setIsLoading(true);
      setError(null);
      try {
        const [statsResult, bookingsResult] = await Promise.allSettled([
          fetchCustomerStats(),
          fetchHistory({ page_size: 5 }),
        ]);
        if (!ignore) {
          if (statsResult.status === 'fulfilled') setStats(statsResult.value);
          else setError('Failed to load dashboard data.');
          if (bookingsResult.status === 'rejected') console.error('Booking fetch failed:', bookingsResult.reason);
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadDashboard();
    return () => { ignore = true; };
  }, [fetchHistory]);

  if (isLoading) return <Loader label="Building your dashboard..." fullScreen />;

  if (error || !stats) {
    return (
      <DashboardShell title={`Welcome, ${user?.name || 'there'}`} links={CUSTOMER_LINKS}>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-lg font-semibold text-rose-600">Failed to load dashboard</p>
          <p className="mt-2 text-sm text-slate-500">{error || 'An unexpected error occurred.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title={`Welcome, ${user?.name || 'there'}`}
      subtitle="Your bookings and spending at a glance."
      links={CUSTOMER_LINKS}
    >
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Receipt}        label="Total Bookings" value={stats.total_bookings} />
          <StatCard icon={Clock3}         label="Active Trips"   value={stats.active_bookings}  accent="bg-emerald-500" />
          <StatCard icon={CarFront}       label="Completed"      value={stats.completed_bookings} accent="bg-sky-600" />
          <StatCard
            icon={CircleDollarSign}
            label="Total Spent"
            value={Number(stats.total_spent)}
            accent="bg-gold"
            trend={formatCurrency(stats.total_spent)}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[1.5rem] border border-slate-200 p-6">
            <h2 className="mb-4 font-heading text-3xl text-ink">Recent Bookings</h2>
            {bookings.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">No bookings yet. Browse vehicles to get started.</div>
            ) : (
              <BookingTable bookings={bookings.slice(0, 5)} />
            )}
          </div>

          <QuickActions
            actions={[
              { label: 'Browse available vehicles', to: '/customer/vehicles' },
              { label: 'View my bookings',          to: '/customer/bookings' },
              { label: 'Update profile',            to: '/customer/profile' },
            ]}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
