import { CalendarClock, CarFront, ClipboardCheck, DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';

import { fetchManagerStats } from '../../api/stats';
import { fetchVehicles } from '../../api/vehicles';
import BookingTable from '../../components/dashboard/BookingTable';
import QuickActions from '../../components/dashboard/QuickActions';
import RevenueChart from '../../components/dashboard/RevenueChart';
import StatCard from '../../components/dashboard/StatCard';
import Loader from '../../components/common/Loader';
import VehicleGrid from '../../components/vehicle/VehicleGrid';
import { useAuth } from '../../hooks/useAuth';
import { useBooking } from '../../hooks/useBooking';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const { bookings, fetchHistory } = useBooking();
  const [stats, setStats] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      setIsLoading(true);
      try {
        const [statsResponse, vehicleResponse] = await Promise.all([
          fetchManagerStats(),
          fetchVehicles({ page: 1, page_size: 50 }),
          fetchHistory({ page_size: 5 }),
        ]);
        if (!ignore) {
          setStats(statsResponse);
          setVehicles(vehicleResponse.items.filter((vehicle) => vehicle.manager_id === user.id));
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

  if (isLoading || !stats) {
    return <Loader label="Loading manager workspace..." fullScreen />;
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Manager Dashboard</p>
        <h1 className="mt-4 font-heading text-5xl text-ink">Fleet visibility with booking control.</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CarFront} label="Fleet Size" value={stats.fleet_size} />
        <StatCard icon={ClipboardCheck} label="Pending Approvals" value={stats.pending_bookings} accent="bg-amber-500" />
        <StatCard icon={CalendarClock} label="Approved Bookings" value={stats.approved_bookings} accent="bg-sky-600" />
        <StatCard icon={DollarSign} label="Monthly Revenue" value={Number(stats.monthly_revenue)} accent="bg-gold" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <RevenueChart data={stats.revenue_trend} />
        <QuickActions
          actions={[
            { label: 'Manage fleet inventory', to: '/dashboard/manager/vehicles' },
            { label: 'Review booking queue', to: '/dashboard/manager/bookings' },
            { label: 'Update profile', to: '/profile' },
          ]}
        />
      </div>

      <div>
        <h2 className="mb-6 font-heading text-3xl text-ink">Recent bookings</h2>
        <BookingTable bookings={bookings.slice(0, 5)} />
      </div>

      <div>
        <h2 className="mb-6 font-heading text-3xl text-ink">Your vehicles</h2>
        <VehicleGrid vehicles={vehicles.slice(0, 3)} showManager />
      </div>
    </div>
  );
}
