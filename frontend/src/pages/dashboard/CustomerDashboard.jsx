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

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      setIsLoading(true);
      try {
        const [statsResponse] = await Promise.all([fetchCustomerStats(), fetchHistory({ page_size: 5 })]);
        if (!ignore) {
          setStats(statsResponse);
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

  if (isLoading || !stats) {
    return <Loader label="Building your customer dashboard..." fullScreen />;
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
