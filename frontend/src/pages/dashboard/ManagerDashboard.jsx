import { CalendarClock, CarFront, ClipboardCheck, DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';

import { fetchManagerStats } from '../../api/stats';
import { fetchVehicles } from '../../api/vehicles';
import { fetchMyRegions } from '../../api/regions';
import BookingTable from '../../components/dashboard/BookingTable';
import QuickActions from '../../components/dashboard/QuickActions';
import RevenueChart from '../../components/dashboard/RevenueChart';
import DashboardShell from '../../components/dashboard/DashboardShell';
import StatCard from '../../components/dashboard/StatCard';
import Loader from '../../components/common/Loader';
import VehicleGrid from '../../components/vehicle/VehicleGrid';
import { useAuth } from '../../hooks/useAuth';
import { useBooking } from '../../hooks/useBooking';
import { CITIES } from '../../utils/cities';

const CITY_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700',
];

function getCityColor(city) {
  const index = CITIES.indexOf(city);
  return CITY_COLORS[index % CITY_COLORS.length];
}

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
  const [regions, setRegions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      setIsLoading(true);
      try {
        const [statsResult, vehicleResult, bookingsResult, regionsResult] = await Promise.allSettled([
          fetchManagerStats(),
          fetchVehicles({ page: 1, page_size: 50 }),
          fetchHistory({ page_size: 5 }),
          fetchMyRegions(),
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
          if (regionsResult.status === 'fulfilled') {
            setRegions(regionsResult.value || []);
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
        { label: 'Update Profile',  to: '/dashboard/manager/profile' },
      ]}
    >
      {/* Regions header */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-6 py-4">
        <p className="mb-2 text-sm font-semibold text-slate-600">Your Regions:</p>
        {regions.length === 0 ? (
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            You have no regions assigned. Contact admin.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {regions.map((city) => (
              <span key={city} className={`rounded-full px-3 py-1 text-xs font-semibold ${getCityColor(city)}`}>{city}</span>
            ))}
          </div>
        )}
      </div>
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
            <p className="mt-5 text-5xl font-bold text-brand">₹{Number(stats.monthly_revenue || 0).toLocaleString('en-IN')}</p>
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
