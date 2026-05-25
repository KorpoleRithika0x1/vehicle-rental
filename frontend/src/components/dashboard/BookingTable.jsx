import BookingStatusBadge from '../booking/BookingStatusBadge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export default function BookingTable({ bookings = [], actions = null }) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {['Vehicle', 'Customer', 'Dates', 'Amount', 'Status', 'Actions'].map((heading) => (
                <th key={heading} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td className="px-6 py-4">
                  <div className="font-semibold text-ink">{booking.vehicle_name || booking.vehicle?.vehicle_name}</div>
                  <div className="text-sm text-slate-500">{booking.brand || booking.vehicle?.brand}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{booking.customer_name || booking.customer?.name || '--'}</td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {formatDate(booking.pickup_date)} - {formatDate(booking.return_date)}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-brand">{formatCurrency(booking.total_amount)}</td>
                <td className="px-6 py-4">
                  <BookingStatusBadge status={booking.status} />
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{actions ? actions(booking) : '--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
