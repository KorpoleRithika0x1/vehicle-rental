import { CalendarDays, MapPin } from 'lucide-react';

import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

const STATUS_STYLES = {
  pending:   'bg-rose-100 text-rose-500',
  approved:  'bg-sky-100 text-sky-600',
  active:    'bg-emerald-100 text-emerald-600',
  completed: 'bg-slate-100 text-slate-500',
  cancelled: 'bg-slate-100 text-slate-400',
};

export default function BookingCard({ booking, onCancel, allowCancel = false }) {
  const vehicleName = booking.vehicle_name || booking.vehicle?.vehicle_name || 'Vehicle';
  const brand = booking.brand || booking.vehicle?.brand || '';
  const image = booking.primary_image || booking.vehicle?.primary_image;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
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

          {allowCancel && booking.status === 'pending' && (
            <button
              type="button"
              onClick={() => onCancel(booking.id)}
              className="mt-1 rounded-full border border-rose-200 px-4 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50"
            >
              Cancel booking
            </button>
          )}
        </div>

        {/* Right — price */}
        <div className="shrink-0 text-right">
          <p className="text-sm text-slate-400">Total Price</p>
          <p className="mt-1 text-2xl font-bold text-brand">{formatCurrency(booking.total_amount)}</p>
          <p className="mt-1 text-xs text-slate-400">Booked on {formatDate(booking.created_at)}</p>
        </div>
      </div>
    </article>
  );
}
