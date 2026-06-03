import { BarChart3, CarFront, ShieldCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

import { fetchAdminStats } from '../../api/stats';
import { fetchUsers } from '../../api/users';
import BookingTable from '../../components/dashboard/BookingTable';
import DashboardShell from '../../components/dashboard/DashboardShell';
import QuickActions from '../../components/dashboard/QuickActions';
import RevenueChart from '../../components/dashboard/RevenueChart';
import StatCard from '../../components/dashboard/StatCard';
import Loader from '../../components/common/Loader';
import { useBooking } from '../../hooks/useBooking';

export default function AdminDashboard() {
  const { bookings, fetchHistory } = useBooking();
  const [stats, setStats] = useState({
    total_vehicles: 0,
    total_bookings: 0,
    pending_bookings: 0,
    approved_bookings: 0,
    monthly_revenue: 0,
    active_users: 0,
    available_vehicles: 0,
    completed_bookings: 0,
    total_users: 0,
    revenue_trend: [],
  });
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      setIsLoading(true);
      try {
        const [statsResult, usersResult, bookingsResult] = await Promise.allSettled([
          fetchAdminStats(),
          fetchUsers({ page: 1, page_size: 5 }),
          fetchHistory({ page_size: 5 }),
        ]);
        if (!ignore) {
          if (statsResult.status === 'fulfilled') {
            setStats({
              total_vehicles: statsResult.value.total_vehicles ?? 0,
              total_bookings: statsResult.value.total_bookings ?? 0,
              pending_bookings: statsResult.value.pending_bookings ?? 0,
              approved_bookings: statsResult.value.approved_bookings ?? 0,
              monthly_revenue: Number(statsResult.value.monthly_revenue ?? 0),
              active_users: statsResult.value.active_users ?? 0,
              available_vehicles: statsResult.value.available_vehicles ?? 0,
              completed_bookings: statsResult.value.completed_bookings ?? 0,
              total_users: statsResult.value.total_users ?? 0,
              revenue_trend: statsResult.value.revenue_trend ?? [],
            });
          }
          if (usersResult.status === 'fulfilled') {
            setUsers(usersResult.value.items || []);
          }
          if (bookingsResult.status === 'rejected') {
            console.error('Admin booking history failed:', bookingsResult.reason);
          }
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
    return <Loader label="Loading admin dashboard..." fullScreen />;
  }

  return (
    <DashboardShell
      title="Admin Dashboard"
      subtitle="Monitor overall platform performance including total cars, bookings, revenue, and recent activities."
      links={[
        { label: 'Dashboard', to: '/dashboard/admin', end: true },
        { label: 'Manage Users', to: '/dashboard/admin/users' },
        { label: 'Manage Managers', to: '/dashboard/admin/managers' },
        { label: 'License Verifications', to: '/dashboard/admin/licenses' },
        { label: 'Reports', to: '/dashboard/admin/reports' },
        { label: 'Reviews', to: '/dashboard/admin/reviews' },
      ]}
    >
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={CarFront} label="Total Cars" value={stats.total_vehicles} />
          <StatCard icon={BarChart3} label="Total Bookings" value={stats.total_bookings} accent="bg-sky-600" />
          <StatCard icon={ShieldCheck} label="Pending" value={stats.pending_bookings} accent="bg-amber-500" />
          <StatCard icon={Users} label="Confirmed" value={stats.approved_bookings} accent="bg-emerald-500" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[1.5rem] border border-slate-200 p-6">
            <h2 className="mb-4 font-heading text-3xl text-ink">Recent Booking</h2>
            <BookingTable bookings={bookings.slice(0, 5)} />
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 p-6">
            <h2 className="font-heading text-3xl text-ink">Recent users</h2>
            <div className="mt-5 space-y-4">
              {users.map((item) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="font-semibold text-ink">{item.name}</div>
                  <div className="text-sm text-slate-500">{item.email}</div>
                  <div className="mt-2 text-xs uppercase tracking-[0.25em] text-brand">{item.role}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <RevenueChart data={stats.revenue_trend} />
          <QuickActions
            actions={[
              { label: 'Manage users', to: '/dashboard/admin/users' },
              { label: 'Manage vehicle managers', to: '/dashboard/admin/managers' },
              { label: 'Monitor all bookings', to: '/dashboard/admin' },
            ]}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[1.5rem] border border-slate-200 p-6">
            <h2 className="font-heading text-3xl text-ink">Platform statistics</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4 text-slate-600">Active users: {stats.active_users}</div>
              <div className="rounded-xl bg-slate-50 p-4 text-slate-600">Available vehicles: {stats.available_vehicles}</div>
              <div className="rounded-xl bg-slate-50 p-4 text-slate-600">Completed bookings: {stats.completed_bookings}</div>
              <div className="rounded-xl bg-slate-50 p-4 text-slate-600">Total users: {stats.total_users}</div>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 p-6">
            <h2 className="font-heading text-3xl text-ink">Monthly Revenue</h2>
            <p className="mt-2 text-lg text-slate-500">Revenue for current month</p>
            <p className="mt-5 text-5xl font-bold text-brand">₹{Number(stats.monthly_revenue || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
