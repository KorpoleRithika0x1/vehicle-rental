import { CarFront, CircleDollarSign, Clock3, Receipt } from 'lucide-react';
import { useEffect, useState } from 'react';

import { fetchCustomerStats } from '../../api/stats';
import BookingTable from '../../components/dashboard/BookingTable';
import QuickActions from '../../components/dashboard/QuickActions';
import StatCard from '../../components/dashboard/StatCard';
import Loader from '../../components/common/Loader';
import { useBooking } from '../../hooks/useBooking';
import { formatCurrency } from '../../utils/formatCurrency';

export default function CustomerDashboard() {
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
        const [statsResponse] = await Promise.all([fetchCustomerStats(), fetchHistory({ page_size: 5 })]);
        if (!ignore) {
          setStats(statsResponse);
        }
      } catch (err) {
        if (!ignore) {
          setError(err?.normalizedMessage || 'Failed to load dashboard data.');
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadDashboard();
    return () => {
      ignore = true;
    };
  }, [fetchHistory]);

  if (isLoading) {
    return <Loader label="Building your customer dashboard..." fullScreen />;
  }

  if (error || !stats) {
    return (
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
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Customer Dashboard</p>
        <h1 className="mt-4 font-heading text-5xl text-ink">Your bookings, spend, and next moves.</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Receipt} label="Total Bookings" value={stats.total_bookings} trend="All time" />
        <StatCard icon={Clock3} label="Pending" value={stats.pending_bookings} accent="bg-amber-500" />
        <StatCard icon={CarFront} label="Active Trips" value={stats.active_bookings} accent="bg-emerald-500" />
        <StatCard icon={CircleDollarSign} label="Total Spent" value={Number(stats.total_spent)} accent="bg-gold" trend={formatCurrency(stats.total_spent)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
        <QuickActions
          actions={[
            { label: 'Browse available vehicles', to: '/vehicles' },
            { label: 'Review booking history', to: '/booking/history' },
            { label: 'Update profile', to: '/profile' },
          ]}
        />
        <BookingTable bookings={bookings.slice(0, 5)} />
      </div>
    </div>
  );
}
