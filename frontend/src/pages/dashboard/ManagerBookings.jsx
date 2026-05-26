import { useEffect, useState } from 'react';

import BookingTable from '../../components/dashboard/BookingTable';
import Loader from '../../components/common/Loader';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { useBooking } from '../../hooks/useBooking';

export default function ManagerBookings() {
  const { bookings, fetchHistory, approveBooking, rejectBooking, completeBooking } = useBooking();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadBookings() {
      setIsLoading(true);
      try {
        await fetchHistory({ page_size: 20 });
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadBookings();
    return () => {
      ignore = true;
    };
  }, [fetchHistory]);

  if (isLoading) {
    return <Loader label="Loading booking queue..." fullScreen />;
  }

  return (
    <DashboardShell
      title="Manage Bookings"
      subtitle="View bookings for your vehicles and approve, reject, or complete rental requests."
      links={[
        { label: 'Dashboard', to: '/dashboard/manager', end: true },
        { label: 'Add Car', to: '/dashboard/manager/vehicles/add', end: true },
        { label: 'Manage Cars', to: '/dashboard/manager/vehicles', end: true },
        { label: 'Manage Bookings', to: '/dashboard/manager/bookings' },
      ]}
    >
      <BookingTable
        bookings={bookings}
        actions={(booking) => (
          <div className="flex flex-wrap gap-2">
            {booking.status === 'pending' ? (
              <>
                <button type="button" onClick={() => approveBooking(booking.id)} className="rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-white">
                  Approve
                </button>
                <button type="button" onClick={() => rejectBooking(booking.id)} className="rounded-full bg-rose-500 px-3 py-2 text-xs font-semibold text-white">
                  Reject
                </button>
              </>
            ) : null}
            {['approved', 'active'].includes(booking.status) ? (
              <button type="button" onClick={() => completeBooking(booking.id)} className="rounded-full bg-brand px-3 py-2 text-xs font-semibold text-white">
                Complete
              </button>
            ) : null}
          </div>
        )}
      />
    </DashboardShell>
  );
}
