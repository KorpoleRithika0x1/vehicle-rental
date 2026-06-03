import { useEffect, useState } from 'react';

import BookingCard from '../../components/booking/BookingCard';
import ReviewModal from '../../components/booking/ReviewModal';
import DashboardShell from '../../components/dashboard/DashboardShell';
import Loader from '../../components/common/Loader';
import Pagination from '../../components/common/Pagination';
import { fetchMyReviewedBookings } from '../../api/reviews';
import { useBooking } from '../../hooks/useBooking';
import { CUSTOMER_LINKS } from '../dashboard/CustomerDashboard';

export default function CustomerHistory() {
  const { bookings, pagination, fetchHistory, cancelBooking } = useBooking();
  const [isLoading, setIsLoading] = useState(true);
  const [reviewedIds, setReviewedIds] = useState(new Set());
  const [reviewTarget, setReviewTarget] = useState(null); // booking to review

  async function loadReviewedIds() {
    try {
      const data = await fetchMyReviewedBookings();
      setReviewedIds(new Set(data.map((r) => r.booking_id)));
    } catch { /* silent */ }
  }

  useEffect(() => {
    let ignore = false;
    async function load() {
      setIsLoading(true);
      try {
        await fetchHistory();
        await loadReviewedIds();
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [fetchHistory]);

  if (isLoading) return <Loader label="Loading rental history..." fullScreen />;

  return (
    <DashboardShell title="Rental History" subtitle="All your past and present bookings." links={CUSTOMER_LINKS}>
      <div className="space-y-5">
        {bookings.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-100 bg-white py-20 text-center shadow-soft">
            <p className="text-lg font-semibold text-slate-500">No booking history yet</p>
            <p className="mt-1 text-sm text-slate-400">Completed and cancelled rentals will appear here.</p>
          </div>
        ) : bookings.map((booking) => (
          <div key={booking.id}>
            <BookingCard booking={booking} allowCancel onCancel={cancelBooking} />
            {booking.status === 'completed' && (
              <div className="mt-2 flex justify-end pr-1">
                {reviewedIds.has(booking.id) ? (
                  <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-600">
                    ✓ Reviewed
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setReviewTarget(booking)}
                    className="rounded-full border border-brand/30 bg-white px-4 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white"
                  >
                    Give Review
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <Pagination
        page={pagination.page}
        totalPages={pagination.total_pages}
        onPageChange={(page) => fetchHistory({ page })}
      />

      {reviewTarget && (
        <ReviewModal
          booking={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSubmitted={() => {
            setReviewedIds((prev) => new Set([...prev, reviewTarget.id]));
            setReviewTarget(null);
          }}
        />
      )}
    </DashboardShell>
  );
}
