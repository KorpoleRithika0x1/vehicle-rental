import { differenceInCalendarDays } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useBooking } from '../../hooks/useBooking';
import { formatCurrency } from '../../utils/formatCurrency';
import DateRangePicker from './DateRangePicker';

export default function BookingForm({ vehicle, availability, disabled = false }) {
  const [pickupDate, setPickupDate] = useState(null);
  const [returnDate, setReturnDate] = useState(null);
  const [inlineError, setInlineError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createBooking } = useBooking();
  const navigate = useNavigate();

  const blockedRanges = useMemo(
    () =>
      (availability?.unavailable_ranges || []).map((range) => ({
        start: new Date(range.pickup_date),
        end: new Date(range.return_date),
      })),
    [availability]
  );

  const totalDays = useMemo(() => {
    if (!pickupDate || !returnDate) return 0;
    return differenceInCalendarDays(returnDate, pickupDate);
  }, [pickupDate, returnDate]);

  const totalPrice = useMemo(() => totalDays * Number(vehicle.rental_price_per_day || 0), [totalDays, vehicle.rental_price_per_day]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!pickupDate || !returnDate) {
      setInlineError('Please select both pickup and return dates.');
      return;
    }

    setInlineError('');
    setIsSubmitting(true);
    try {
      await createBooking({
        vehicle_id: vehicle.id,
        pickup_date: pickupDate.toISOString(),
        return_date: returnDate.toISOString(),
      });
      navigate('/booking/history');
    } catch (error) {
      setInlineError(
        error.statusCode === 409
          ? 'Vehicle is currently being booked. Try again in a moment.'
          : error.normalizedMessage
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel space-y-5 p-6">
      <div>
        <h3 className="font-heading text-2xl text-ink">Secure This Vehicle</h3>
        <p className="mt-2 text-sm text-slate-500">Live availability is checked before your request is created.</p>
      </div>

      <DateRangePicker
        startDate={pickupDate}
        endDate={returnDate}
        onStartChange={setPickupDate}
        onEndChange={setReturnDate}
        excludeDateIntervals={blockedRanges}
      />

      <div className="rounded-2xl bg-slate-50 p-4">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Price per day</span>
          <span>{formatCurrency(vehicle.rental_price_per_day)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
          <span>Rental duration</span>
          <span>{totalDays > 0 ? `${totalDays} day(s)` : '--'}</span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-lg font-semibold text-brand">
          <span>Total</span>
          <span>{formatCurrency(totalPrice)}</span>
        </div>
      </div>

      {inlineError && (
        <div className="flex items-start gap-2 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          {inlineError}
        </div>
      )}

      <button
        type="submit"
        disabled={disabled || isSubmitting}
        className="w-full rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Submitting booking...' : 'Confirm Booking'}
      </button>
    </form>
  );
}
