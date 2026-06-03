import { CarFront, CircleDollarSign, Clock3, Receipt } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell,
  Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

import { fetchCustomerStats } from '../../api/stats';
import BookingTable from '../../components/dashboard/BookingTable';
import ChatBot from '../../components/dashboard/ChatBot';
import DashboardShell from '../../components/dashboard/DashboardShell';
import QuickActions from '../../components/dashboard/QuickActions';
import StatCard from '../../components/dashboard/StatCard';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';
import { useBooking } from '../../hooks/useBooking';
import { formatCurrency } from '../../utils/formatCurrency';

const BAR_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const CUSTOMER_LINKS = [
  { label: 'Dashboard',       to: '/customer/dashboard',  end: true },
  { label: 'Browse Vehicles', to: '/customer/vehicles' },
  { label: 'My Bookings',     to: '/customer/bookings' },
  { label: 'Update Profile',  to: '/customer/profile' },
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

        {/* Charts row — above recent bookings */}
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Line chart — bookings per month */}
          <div className="rounded-[1.5rem] border border-slate-200 p-6">
            <h2 className="mb-1 font-heading text-2xl text-ink">Bookings (Last 6 Months)</h2>
            <p className="mb-4 text-sm text-slate-400">Number of bookings per month</p>
            {stats.booking_trend?.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats.booking_trend} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip formatter={(v) => [v, 'Bookings']} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Bookings"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#6366f1' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">No data yet</div>
            )}
          </div>

          {/* Bar chart — spending per month */}
          <div className="rounded-[1.5rem] border border-slate-200 p-6">
            <h2 className="mb-1 font-heading text-2xl text-ink">Spending (Last 6 Months)</h2>
            <p className="mb-4 text-sm text-slate-400">Total expenditure per month (₹)</p>
            {stats.spending_trend?.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.spending_trend} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [formatCurrency(v), 'Spent']} />
                  <Bar dataKey="revenue" name="Spent" radius={[6, 6, 0, 0]}>
                    {stats.spending_trend.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">No data yet</div>
            )}
          </div>
        </div>

        {/* Recent bookings + quick actions */}
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[1.5rem] border border-slate-200 p-6">
            <h2 className="mb-4 font-heading text-3xl text-ink">Recent Bookings</h2>
            {bookings.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">No bookings yet. Browse vehicles to get started.</div>
            ) : (
              <BookingTable bookings={bookings.slice(0, 5)} />
            )}
          </div>

          <div className="h-full">
            <QuickActions
              actions={[
                { label: 'Browse available vehicles', to: '/customer/vehicles' },
                { label: 'View my bookings',          to: '/customer/bookings' },
                { label: 'Update profile',            to: '/customer/profile' },
              ]}
            />
          </div>
        </div>
      </div>
      <ChatBot />
    </DashboardShell>
  );
}
