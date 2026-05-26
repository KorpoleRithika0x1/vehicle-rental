import { useEffect, useState } from 'react';

import BookingCard from '../../components/booking/BookingCard';
import Loader from '../../components/common/Loader';
import Pagination from '../../components/common/Pagination';
import { useBooking } from '../../hooks/useBooking';

export default function BookingHistory() {
  const { bookings, pagination, fetchHistory, cancelBooking } = useBooking();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function loadHistory() {
      setIsLoading(true);
      try {
        await fetchHistory();
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    loadHistory();
    return () => {
      ignore = true;
    };
  }, [fetchHistory]);

  if (isLoading) {
    return <Loader label="Loading booking history..." fullScreen />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-ink">My Bookings</h1>
        <p className="mt-2 text-sm text-slate-400">View and manage your all car bookings</p>
      </div>

      <div className="space-y-5">
        {bookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} allowCancel onCancel={cancelBooking} />
        ))}
      </div>

      <Pagination page={pagination.page} totalPages={pagination.total_pages} onPageChange={(page) => fetchHistory({ page })} />
    </div>
  );
}
