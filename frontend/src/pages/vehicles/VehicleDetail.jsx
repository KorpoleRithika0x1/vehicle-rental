import { useEffect, useState } from 'react';
import { ArrowLeft, Car, CheckCircle2, Fuel, MapPin, Users } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import Loader from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';
import { useBooking } from '../../hooks/useBooking';
import { useVehicleStore } from '../../store/vehicleStore';
import { formatCurrency } from '../../utils/formatCurrency';

const vehicleTypeLabels = { car: 'Sedan', suv: 'SUV', van: 'Van', truck: 'Scooty', bike: 'Bike' };

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedVehicle, fetchVehicle } = useVehicleStore();
  const { isAuthenticated, user } = useAuth();
  const { createBooking } = useBooking();
  const [isLoading, setIsLoading] = useState(true);
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [addons, setAddons] = useState({
    theft: false,
    collision: false,
    insurance: false,
    driver: false,
  });

  const ADDONS = [
    { key: 'theft',     label: 'Theft protection',        price: 13 },
    { key: 'collision', label: 'Collision damage waiver', price: 9  },
    { key: 'insurance', label: 'Full insurance',           price: 19 },
    { key: 'driver',    label: 'Additional driver',        price: 20 },
  ];

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    fetchVehicle(id).finally(() => { if (!ignore) setIsLoading(false); });
    return () => { ignore = true; };
  }, [fetchVehicle, id]);

  if (isLoading || !selectedVehicle) return <Loader label="Loading vehicle..." fullScreen />;

  const v = selectedVehicle;
  const typeLabel = vehicleTypeLabels[v.vehicle_type] || v.vehicle_type;
  const stockCount = Number(v.vehicle_count ?? 0);
  const isOutOfStock = !v.availability_status || stockCount === 0;
  const stockBadge = isOutOfStock
    ? { label: 'Out of Stock', className: 'bg-rose-100 text-rose-700' }
    : stockCount === 1
      ? { label: 'Low Stock — 1 left', className: 'bg-amber-100 text-amber-700' }
      : { label: 'Available', className: 'bg-emerald-100 text-emerald-700' };
  const canBook = isAuthenticated && user?.role === 'customer' && !isOutOfStock;
  const addonDailyTotal = ADDONS.reduce((sum, a) => sum + (addons[a.key] ? a.price : 0), 0);
  const totalDailyRate = Number(v.rental_price_per_day || 0) + addonDailyTotal;

  const rentalDays = pickupDate && returnDate && new Date(returnDate) > new Date(pickupDate)
    ? Math.ceil((new Date(returnDate) - new Date(pickupDate)) / 86400000)
    : 0;
  const totalBookingAmount = totalDailyRate * rentalDays;
  const depositAmount = Math.ceil(totalBookingAmount * 0.25);

  async function handleBook(e) {
    e.preventDefault();
    if (!pickupDate || !returnDate) { setError('Please select both dates.'); return; }
    if (new Date(returnDate) <= new Date(pickupDate)) { setError('Return date must be after the pickup date.'); return; }
    setError('');
    setIsSubmitting(true);
    try {
      await createBooking({
        vehicle_id: v.id,
        pickup_date: new Date(pickupDate).toISOString(),
        return_date: new Date(returnDate).toISOString(),
      });
      navigate('/booking/history');
    } catch (err) {
      setError(err?.normalizedMessage || 'Booking failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link to="/vehicles" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" />
        Back to all cars
      </Link>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        {/* Left — image + details */}
        <div>
          <img
            src={v.images?.[0]?.image_url || v.primary_image || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80'}
            alt={v.vehicle_name}
            className="w-full rounded-2xl object-cover"
            style={{ maxHeight: 420 }}
          />

          {/* Name + type */}
          <div className="mt-6">
            <h1 className="text-3xl font-bold text-ink">{v.vehicle_name}</h1>
            <p className="mt-1 text-slate-400">{typeLabel} • {v.brand}</p>
          </div>

          <hr className="my-6 border-slate-200" />

          {/* Spec tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Users, label: `${v.seating_capacity} Seats` },
              { icon: Fuel, label: v.fuel_type.charAt(0).toUpperCase() + v.fuel_type.slice(1) },
              { icon: Car, label: typeLabel },
              { icon: MapPin, label: isOutOfStock ? 'Out of stock' : `${stockCount} in stock` },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 rounded-xl bg-slate-100 py-4 text-sm font-semibold text-slate-700">
                <Icon className="h-5 w-5 text-slate-600" strokeWidth={2.5} />
                {label}
              </div>
            ))}
          </div>

          {/* Description */}
          {v.description && (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-ink">Description</h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">{v.description}</p>
            </div>
          )}

          {/* Features — derived from vehicle specs */}
          <div className="mt-8">
            <h2 className="text-lg font-bold text-ink">Features</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                `${v.seating_capacity} Seats`,
                `${v.fuel_type.charAt(0).toUpperCase() + v.fuel_type.slice(1)} Engine`,
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
            {/* Price */}
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
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">Pickup Date</label>
                  <input
                    type="date"
                    value={pickupDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">Return Date</label>
                  <input
                    type="date"
                    value={returnDate}
                    min={pickupDate ? new Date(new Date(pickupDate).getTime() + 86400000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
                  />
                </div>

                {/* Add-ons */}
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
                            className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                          />
                          <span className="text-slate-600">{addon.label}</span>
                        </div>
                        <span className="font-medium text-slate-500">${addon.price}/day</span>
                      </label>
                    ))}
                  </div>
                </div>

                {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}
                {user?.license_verified ? (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
                  >
                    {isSubmitting ? 'Booking...' : 'Book Now'}
                  </button>
                ) : (
                  <Link
                    to="/profile"
                    className="block w-full rounded-xl bg-amber-500 py-3 text-center text-sm font-bold text-white transition hover:bg-amber-600 shadow-md"
                  >
                    Verify your driving license to rent → Go to Profile
                  </Link>
                )}
                <p className="text-center text-xs text-slate-400">No credit card required to reserve</p>
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
                ) : (
                  <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    {isOutOfStock ? 'This vehicle is currently out of stock.' : 'Only customers can book vehicles.'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
