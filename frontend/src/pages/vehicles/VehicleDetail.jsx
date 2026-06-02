import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowLeft, Car, CheckCircle2, Fuel, MapPin, Users } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { fetchBookingAvailability, fetchBookings } from '../../api/bookings';
import Loader from '../../components/common/Loader';
import DateRangePicker from '../../components/booking/DateRangePicker';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatCurrency';
import { useVehicleStore } from '../../store/vehicleStore';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { CUSTOMER_LINKS } from '../dashboard/CustomerDashboard';

// Lazy-load PaymentModal so Stripe only initialises when actually needed
const PaymentModal = lazy(() => import('../../components/booking/PaymentModal'));

const vehicleTypeLabels = { car: 'Sedan', suv: 'SUV', van: 'Van', truck: 'Scooty', bike: 'Bike' };

const ADDONS = [
  { key: 'theft',     label: 'Theft protection',        price: 13 },
  { key: 'collision', label: 'Collision damage waiver', price: 9  },
  { key: 'insurance', label: 'Full insurance',           price: 19 },
  { key: 'driver',    label: 'Additional driver',        price: 20 },
];

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedVehicle, fetchVehicle } = useVehicleStore();
  const { isAuthenticated, user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [availability, setAvailability] = useState(null);
  const [hasActiveBooking, setHasActiveBooking] = useState(false);
  const [pickupDate, setPickupDate] = useState(null);
  const [returnDate, setReturnDate] = useState(null);
  const [error, setError] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [addons, setAddons] = useState({ theft: false, collision: false, insurance: false, driver: false });

  const isCustomer = isAuthenticated && user?.role === 'customer';

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);

    const tasks = [
      fetchVehicle(id).catch(() => null),
      fetchBookingAvailability(id)
        .then((data) => { if (!ignore) setAvailability(data); })
        .catch(() => {}),
    ];

    if (isCustomer) {
      tasks.push(
        fetchBookings({ status: 'approved', page_size: 50 })
          .then((data) => { if (!ignore) setHasActiveBooking((data.items || []).length > 0); })
          .catch(() => {})
      );
    }

    Promise.all(tasks).finally(() => { if (!ignore) setIsLoading(false); });

    return () => { ignore = true; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <Loader label="Loading vehicle..." fullScreen />;

  if (!selectedVehicle || !selectedVehicle.id) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-rose-600">Vehicle not found</p>
          <Link to="/customer/vehicles" className="mt-4 inline-block text-sm text-brand underline">
            Back to vehicles
          </Link>
        </div>
      </div>
    );
  }

  const v = selectedVehicle;
  const typeLabel = vehicleTypeLabels[v.vehicle_type] || v.vehicle_type;
  const stockCount = Number(v.vehicle_count ?? 0);
  const isOutOfStock = !v.availability_status || stockCount === 0;
  const fuelLabel = v.fuel_type ? v.fuel_type.charAt(0).toUpperCase() + v.fuel_type.slice(1) : '';

  const blockedRanges = (availability?.unavailable_ranges || []).map((r) => ({
    start: new Date(r.pickup_date),
    end: new Date(r.return_date),
  }));

  const hasOverlap = Boolean(
    pickupDate && returnDate &&
    blockedRanges.some((r) => pickupDate < r.end && returnDate > r.start)
  );

  const canBook = isCustomer && !isOutOfStock && !hasActiveBooking;

  const addonDailyTotal = ADDONS.reduce((sum, a) => sum + (addons[a.key] ? a.price : 0), 0);
  const totalDailyRate = Number(v.rental_price_per_day || 0) + addonDailyTotal;
  const rentalDays = pickupDate && returnDate && returnDate > pickupDate
    ? Math.ceil((returnDate - pickupDate) / 86400000)
    : 0;
  const totalBookingAmount = totalDailyRate * rentalDays;
  const depositAmount = Math.ceil(totalBookingAmount * 0.25);

  const stockBadge = isOutOfStock
    ? { label: 'Unavailable', className: 'bg-rose-100 text-rose-700' }
    : { label: 'Available', className: 'bg-emerald-100 text-emerald-700' };

  // Clear overlap error when dates change
  const dateError = hasOverlap
    ? 'This vehicle is not available for the selected dates.'
    : '';

  function handleBook(e) {
    e.preventDefault();
    if (!pickupDate || !returnDate) { setError('Please select both dates.'); return; }
    if (returnDate <= pickupDate) { setError('Return date must be after pickup date.'); return; }
    if (hasOverlap) { setError('Vehicle is not available for selected dates.'); return; }
    setError('');
    setShowPayment(true);
  }

  // Back link — go back to customer vehicles if authenticated customer, else public list
  const backTo = isCustomer ? '/customer/vehicles' : '/vehicles';
  const backLabel = isCustomer ? 'Back to vehicles' : 'Back to all cars';

  const content = (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Payment modal — lazy loaded */}
      {showPayment && (
        <Suspense fallback={null}>
          <PaymentModal
            vehicle={v}
            pickupDate={pickupDate}
            returnDate={returnDate}
            onClose={() => setShowPayment(false)}
            onSuccess={() => {
              setShowPayment(false);
              navigate(isCustomer ? '/customer/bookings' : '/booking/history');
            }}
          />
        </Suspense>
      )}

      {/* Back link */}
      <Link to={backTo} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      {hasActiveBooking && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-semibold">You already have an active booking. </span>
          Complete or cancel it before booking another vehicle.{' '}
          <Link to="/customer/bookings" className="font-semibold underline">View My Bookings</Link>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        {/* Left — image + details */}
        <div>
          <img
            src={v.images?.[0]?.image_url || v.primary_image || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80'}
            alt={v.vehicle_name}
            className="w-full rounded-2xl object-cover"
            style={{ maxHeight: 420 }}
          />

          <div className="mt-6">
            <h1 className="text-3xl font-bold text-ink">{v.vehicle_name}</h1>
            <p className="mt-1 text-slate-400">{typeLabel} • {v.brand}</p>
          </div>

          <hr className="my-6 border-slate-200" />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Users, label: `${v.seating_capacity} Seats` },
              { icon: Fuel,  label: fuelLabel },
              { icon: Car,   label: typeLabel },
              { icon: MapPin, label: v.city || (isOutOfStock ? 'Out of stock' : `${stockCount} in stock`) },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 rounded-xl bg-slate-100 py-4 text-sm font-semibold text-slate-700">
                <Icon className="h-5 w-5 text-slate-600" strokeWidth={2.5} />
                {label}
              </div>
            ))}
          </div>

          {v.description && (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-ink">Description</h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">{v.description}</p>
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-lg font-bold text-ink">Features</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                `${v.seating_capacity} Seats`,
                `${fuelLabel} Engine`,
                typeLabel,
                `Reg: ${v.registration_number}`,
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-brand" />
                  {feat}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — booking card */}
        <div className="lg:sticky lg:top-8 h-fit">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
              <span className="text-3xl font-bold text-ink">{formatCurrency(totalDailyRate)}</span>
              <span className="text-sm text-slate-400">per day</span>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm font-medium text-slate-600">Stock</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stockBadge.className}`}>
                {stockBadge.label}
              </span>
            </div>

            {canBook ? (
              <form onSubmit={handleBook} className="mt-5 space-y-4">
                <DateRangePicker
                  startDate={pickupDate}
                  endDate={returnDate}
                  onStartChange={(d) => { setPickupDate(d); setError(''); }}
                  onEndChange={(d) => { setReturnDate(d); setError(''); }}
                  excludeDateIntervals={blockedRanges}
                />

                <div>
                  <p className="mb-2 text-sm font-medium text-slate-600">Add-ons</p>
                  <div className="space-y-2">
                    {ADDONS.map((addon) => (
                      <label key={addon.key} className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-sm hover:border-brand">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={addons[addon.key]}
                            onChange={(e) => setAddons((c) => ({ ...c, [addon.key]: e.target.checked }))}
                            className="h-4 w-4 rounded border-slate-300 text-brand"
                          />
                          <span className="text-slate-600">{addon.label}</span>
                        </div>
                        <span className="font-medium text-slate-500">₹{addon.price}/day</span>
                      </label>
                    ))}
                  </div>
                </div>

                {(error || dateError) && (
                  <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
                    {error || dateError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!pickupDate || !returnDate || hasOverlap}
                  className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  Proceed to Payment
                </button>
                <p className="text-center text-xs text-slate-400">Secure payment via Stripe</p>
                <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                  <span className="font-semibold text-slate-600">Deposit at pick-up: </span>
                  {rentalDays > 0 ? formatCurrency(depositAmount) : '25% of total booking amount'}
                </div>
              </form>
            ) : (
              <div className="mt-5 space-y-4">
                {!isAuthenticated ? (
                  <>
                    <p className="text-sm text-slate-500">Sign in as a customer to book this vehicle.</p>
                    <Link to="/login" className="block w-full rounded-xl bg-brand py-3 text-center text-sm font-bold text-white">
                      Sign in to Book
                    </Link>
                  </>
                ) : hasActiveBooking ? (
                  <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Complete or cancel your current booking before booking again.
                  </p>
                ) : (
                  <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    {isOutOfStock ? 'This vehicle is currently unavailable.' : 'Only customers can book vehicles.'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isCustomer) {
    return <DashboardShell links={CUSTOMER_LINKS}>{content}</DashboardShell>;
  }

  return content;
}
