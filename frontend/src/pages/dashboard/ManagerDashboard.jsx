import { CalendarClock, CarFront, ClipboardCheck, DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';

import { fetchManagerStats } from '../../api/stats';
import { fetchVehicles } from '../../api/vehicles';
import BookingTable from '../../components/dashboard/BookingTable';
import QuickActions from '../../components/dashboard/QuickActions';
import RevenueChart from '../../components/dashboard/RevenueChart';
import DashboardShell from '../../components/dashboard/DashboardShell';
import StatCard from '../../components/dashboard/StatCard';
import Loader from '../../components/common/Loader';
import VehicleGrid from '../../components/vehicle/VehicleGrid';
import { useAuth } from '../../hooks/useAuth';
import { useBooking } from '../../hooks/useBooking';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const { bookings, fetchHistory } = useBooking();
  const [stats, setStats] = useState({
    fleet_size: 0,
    pending_bookings: 0,
    approved_bookings: 0,
    monthly_revenue: 0,
    revenue_trend: [],
  });
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      setIsLoading(true);
      try {
        const [statsResult, vehicleResult, bookingsResult] = await Promise.allSettled([
          fetchManagerStats(),
          fetchVehicles({ page: 1, page_size: 50 }),
          fetchHistory({ page_size: 5 }),
        ]);
        if (!ignore) {
          if (statsResult.status === 'fulfilled') {
            setStats({
              fleet_size: statsResult.value.fleet_size ?? 0,
              pending_bookings: statsResult.value.pending_bookings ?? 0,
              approved_bookings: statsResult.value.approved_bookings ?? 0,
              monthly_revenue: Number(statsResult.value.monthly_revenue ?? 0),
              revenue_trend: statsResult.value.revenue_trend ?? [],
            });
          }
          if (vehicleResult.status === 'fulfilled') {
            setVehicles((vehicleResult.value.items || []).filter((vehicle) => vehicle.manager_id === user.id));
          }
          if (bookingsResult.status === 'rejected') {
            console.error('Manager booking history failed:', bookingsResult.reason);
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
  }, [fetchHistory, user.id]);

  if (isLoading) {
    return <Loader label="Loading manager workspace..." fullScreen />;
  }

  return (
    <DashboardShell
      title="Vehicle Manager Dashboard"
      subtitle="Manage your fleet listings, booking requests, pricing, availability, and earnings."
      links={[
        { label: 'Dashboard', to: '/dashboard/manager', end: true },
        { label: 'Add Car', to: '/dashboard/manager/vehicles/add', end: true },
        { label: 'Manage Cars', to: '/dashboard/manager/vehicles', end: true },
        { label: 'Manage Bookings', to: '/dashboard/manager/bookings' },
      ]}
    >
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={CarFront} label="Total Cars" value={stats.fleet_size} />
          <StatCard icon={ClipboardCheck} label="Pending Requests" value={stats.pending_bookings} accent="bg-amber-500" />
          <StatCard icon={CalendarClock} label="Confirmed" value={stats.approved_bookings} accent="bg-sky-600" />
          <StatCard icon={DollarSign} label="Monthly Revenue" value={Number(stats.monthly_revenue)} accent="bg-gold" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[1.5rem] border border-slate-200 p-6">
            <h2 className="mb-4 font-heading text-3xl text-ink">Recent Booking</h2>
            <BookingTable bookings={bookings.slice(0, 5)} />
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 p-6">
            <h2 className="font-heading text-3xl text-ink">Monthly Revenue</h2>
            <p className="mt-2 text-lg text-slate-500">Revenue for current month</p>
            <p className="mt-5 text-5xl font-bold text-brand">${Number(stats.monthly_revenue || 0)}</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <RevenueChart data={stats.revenue_trend} />
          <QuickActions
            actions={[
              { label: 'Add vehicle listing', to: '/dashboard/manager/vehicles/add' },
              { label: 'Review rental requests', to: '/dashboard/manager/bookings' },
              { label: 'Update profile', to: '/profile' },
            ]}
          />
        </div>

        <div>
          <h2 className="mb-6 font-heading text-3xl text-ink">Managed fleet</h2>
          <VehicleGrid vehicles={vehicles.slice(0, 3)} showManager />
        </div>
      </div>
    </DashboardShell>
  );
}
