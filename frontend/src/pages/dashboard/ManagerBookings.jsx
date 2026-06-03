import { useEffect, useState } from 'react';

import BookingTable from '../../components/dashboard/BookingTable';
import Loader from '../../components/common/Loader';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { useBooking } from '../../hooks/useBooking';

export default function ManagerBookings() {
  const { bookings, fetchHistory, completeBooking } = useBooking();
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
      subtitle="Complete bookings once the return date has passed."
      links={[
        { label: 'Dashboard', to: '/dashboard/manager', end: true },
        { label: 'Add Car', to: '/dashboard/manager/vehicles/add', end: true },
        { label: 'Manage Cars', to: '/dashboard/manager/vehicles', end: true },
        { label: 'Manage Bookings', to: '/dashboard/manager/bookings' },
        { label: 'Reviews', to: '/dashboard/manager/reviews' },
        { label: 'Update Profile', to: '/dashboard/manager/profile' },
      ]}
    >
      <BookingTable
        bookings={bookings}
        actions={(booking) => {
          if (booking.status !== 'approved') return null;
          const canComplete = new Date() >= new Date(booking.return_date);
          return (
            <button
              type="button"
              onClick={() => canComplete && completeBooking(booking.id)}
              disabled={!canComplete}
              title={!canComplete ? 'Available after return date' : 'Mark as completed'}
              className={`rounded-full px-3 py-2 text-xs font-semibold text-white transition ${
                canComplete
                  ? 'bg-brand hover:opacity-90'
                  : 'cursor-not-allowed bg-slate-300'
              }`}
            >
              Complete
            </button>
          );
        }}
      />
    </DashboardShell>
  );
}
