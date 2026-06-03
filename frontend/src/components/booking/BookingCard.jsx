import { useState } from 'react';
import { CalendarDays, MapPin } from 'lucide-react';

import ReviewModal from './ReviewModal';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

const STATUS_STYLES = {
  pending:   'bg-rose-100 text-rose-500',
  approved:  'bg-sky-100 text-sky-600',
  active:    'bg-emerald-100 text-emerald-600',
  completed: 'bg-slate-100 text-slate-500',
  cancelled: 'bg-slate-100 text-slate-400',
};

export default function BookingCard({ booking, onCancel, allowCancel = false, onReviewSubmitted, isReviewed = false }) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const vehicleName = booking.vehicle_name || booking.vehicle?.vehicle_name || 'Vehicle';
  const brand = booking.brand || booking.vehicle?.brand || '';
  const image = booking.primary_image || booking.vehicle?.primary_image;

  // Cancel is allowed only for approved bookings where pickup is more than 24h away
  const canCancel = allowCancel &&
    booking.status === 'approved' &&
    new Date(booking.pickup_date) - Date.now() > 24 * 60 * 60 * 1000;

  const cancelDisabledReason = allowCancel && booking.status === 'approved' && !canCancel
    ? 'Cancellation not allowed within 24 hours of pickup'
    : null;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        {/* Image + vehicle name */}
        <div className="shrink-0">
          <img
            src={image || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=400&q=80'}
            alt={vehicleName}
            className="h-36 w-52 rounded-xl object-cover"
          />
          <div className="mt-3">
            <p className="font-bold text-ink">{vehicleName}</p>
            <p className="text-xs text-slate-400">{brand}</p>
          </div>
        </div>

        {/* Middle — booking info */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700">
              Booking #{booking.id}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[booking.status] || 'bg-slate-100 text-slate-500'}`}>
              {booking.status}
            </span>
          </div>

          <div className="flex items-start gap-2 text-sm text-slate-600">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <div>
              <p className="font-medium text-slate-500">Rental Period</p>
              <p className="font-semibold text-slate-700">{formatDate(booking.pickup_date)} To {formatDate(booking.return_date)}</p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm text-slate-600">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <div>
              <p className="font-medium text-slate-500">Pick-up Location</p>
              <p className="font-semibold text-slate-700">Available at pickup</p>
            </div>
          </div>
        </div>

        {/* Right — price + actions */}
        <div className="flex flex-col justify-between text-right sm:shrink-0">
          <div>
            <p className="text-sm text-slate-400">Total Price</p>
            <p className="mt-1 text-2xl font-bold text-brand">{formatCurrency(booking.total_amount)}</p>
            <p className="mt-1 text-xs text-slate-400">Booked on {formatDate(booking.created_at)}</p>
          </div>

          {/* Cancel button */}
          {allowCancel && booking.status === 'approved' && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => canCancel && onCancel(booking.id)}
                disabled={!canCancel}
                title={cancelDisabledReason || 'Cancel this booking'}
                className="rounded-full border border-rose-200 px-4 py-1.5 text-xs font-semibold text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              >
                Cancel booking
              </button>
              {cancelDisabledReason && (
                <p className="mt-1 text-[10px] text-slate-400">{cancelDisabledReason}</p>
              )}
            </div>
          )}

          {/* Review button */}
          {booking.status === 'completed' && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => !isReviewed && setShowReviewModal(true)}
                disabled={isReviewed}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  isReviewed
                    ? 'border border-emerald-200 text-emerald-600 cursor-not-allowed'
                    : 'border border-brand text-brand hover:bg-brand/5'
                }`}
              >
                {isReviewed ? '✓ Reviewed' : 'Give Review'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showReviewModal && (
        <ReviewModal
          booking={booking}
          onClose={() => setShowReviewModal(false)}
          onSubmitted={() => {
            setShowReviewModal(false);
            onReviewSubmitted?.();
          }}
        />
      )}
    </article>
  );
}
