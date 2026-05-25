import { BarChart3, CarFront, ShieldCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

import { fetchAdminStats } from '../../api/stats';
import { fetchUsers } from '../../api/users';
import BookingTable from '../../components/dashboard/BookingTable';
import QuickActions from '../../components/dashboard/QuickActions';
import RevenueChart from '../../components/dashboard/RevenueChart';
import StatCard from '../../components/dashboard/StatCard';
import Loader from '../../components/common/Loader';
import { useBooking } from '../../hooks/useBooking';

export default function AdminDashboard() {
  const { bookings, fetchHistory } = useBooking();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      setIsLoading(true);
      try {
        const [statsResponse, usersResponse] = await Promise.all([
          fetchAdminStats(),
          fetchUsers({ page: 1, page_size: 5 }),
          fetchHistory({ page_size: 5 }),
        ]);
        if (!ignore) {
          setStats(statsResponse);
          setUsers(usersResponse.items);
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
    return <Loader label="Loading admin overview..." fullScreen />;
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Admin Dashboard</p>
        <h1 className="mt-4 font-heading text-5xl text-ink">Operational clarity across users, fleet, and bookings.</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={stats.total_users} />
        <StatCard icon={ShieldCheck} label="Active Users" value={stats.active_users} accent="bg-emerald-500" />
        <StatCard icon={CarFront} label="Vehicles Listed" value={stats.total_vehicles} accent="bg-sky-600" />
        <StatCard icon={BarChart3} label="Monthly Revenue" value={Number(stats.monthly_revenue)} accent="bg-gold" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <RevenueChart data={stats.revenue_trend} />
        <QuickActions
          actions={[
            { label: 'Manage users', to: '/dashboard/admin/users' },
            { label: 'Review all bookings', to: '/dashboard/admin' },
            { label: 'Profile settings', to: '/profile' },
          ]}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h2 className="mb-6 font-heading text-3xl text-ink">Recent bookings</h2>
          <BookingTable bookings={bookings.slice(0, 5)} />
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
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
    </div>
  );
}
