import { CalendarDays, CircleDollarSign } from 'lucide-react';

import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import BookingStatusBadge from './BookingStatusBadge';

export default function BookingCard({ booking, onCancel, allowCancel = false }) {
  return (
    <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-heading text-2xl text-ink">{booking.vehicle_name || booking.vehicle?.vehicle_name}</h3>
          <p className="text-sm text-slate-500">{booking.brand || booking.vehicle?.brand}</p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <CalendarDays className="h-4 w-4 text-brand" />
          {formatDate(booking.pickup_date)} to {formatDate(booking.return_date)}
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <CircleDollarSign className="h-4 w-4 text-brand" />
          {formatCurrency(booking.total_amount)}
        </div>
      </div>
      {allowCancel && booking.status === 'pending' && (
        <button type="button" onClick={() => onCancel(booking.id)} className="mt-5 rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600">
          Cancel booking
        </button>
      )}
    </article>
  );
}
