import { useEffect, useState } from 'react';

import BookingCard from '../../components/booking/BookingCard';
import DashboardShell from '../../components/dashboard/DashboardShell';
import Loader from '../../components/common/Loader';
import Pagination from '../../components/common/Pagination';
import { fetchMyReviewedBookings } from '../../api/reviews';
import { useBooking } from '../../hooks/useBooking';
import { CUSTOMER_LINKS } from '../dashboard/CustomerDashboard';

export default function CustomerBookings() {
  const { bookings, pagination, fetchHistory, cancelBooking } = useBooking();
  const [isLoading, setIsLoading] = useState(true);
  const [reviewedBookingIds, setReviewedBookingIds] = useState(new Set());

  useEffect(() => {
    let ignore = false;
    async function load() {
      setIsLoading(true);
      try {
        await fetchHistory();
        const reviewed = await fetchMyReviewedBookings();
        if (!ignore) {
          setReviewedBookingIds(new Set(reviewed.map((r) => r.booking_id)));
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [fetchHistory]);

  async function handleReviewSubmitted() {
    await fetchHistory();
    const reviewed = await fetchMyReviewedBookings();
    setReviewedBookingIds(new Set(reviewed.map((r) => r.booking_id)));
  }

  if (isLoading) return <Loader label="Loading bookings..." fullScreen />;

  return (
    <DashboardShell title="My Bookings" subtitle="Your active and upcoming rentals." links={CUSTOMER_LINKS}>
      <div className="space-y-5">
        {bookings.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-100 bg-white py-20 text-center shadow-soft">
            <p className="text-lg font-semibold text-slate-500">No bookings yet</p>
            <p className="mt-1 text-sm text-slate-400">Browse vehicles to make your first booking.</p>
          </div>
        ) : bookings.map((booking) => (
          <BookingCard 
            key={booking.id} 
            booking={booking} 
            allowCancel 
            onCancel={cancelBooking}
            onReviewSubmitted={handleReviewSubmitted}
            isReviewed={reviewedBookingIds.has(booking.id)}
          />
        ))}
      </div>
      <Pagination
        page={pagination.page}
        totalPages={pagination.total_pages}
        onPageChange={(page) => fetchHistory({ page })}
      />
    </DashboardShell>
  );
}
