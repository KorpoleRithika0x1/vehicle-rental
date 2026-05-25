import { useEffect, useState } from 'react';
import { Calendar, Fuel, ShieldCheck, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import BookingForm from '../../components/booking/BookingForm';
import VehicleImageGallery from '../../components/vehicle/VehicleImageGallery';
import { useAuth } from '../../hooks/useAuth';
import { useVehicleStore } from '../../store/vehicleStore';
import { formatCurrency } from '../../utils/formatCurrency';

export default function VehicleDetail() {
  const { id } = useParams();
  const { selectedVehicle, availability, fetchVehicle, fetchAvailability } = useVehicleStore();
  const { isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadDetail() {
      setIsLoading(true);
      try {
        await Promise.all([fetchVehicle(id), fetchAvailability(id)]);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadDetail();
    return () => {
      ignore = true;
    };
  }, [fetchAvailability, fetchVehicle, id]);

  if (isLoading || !selectedVehicle) {
    return <Loader label="Preparing vehicle detail..." fullScreen />;
  }

  const canBook = isAuthenticated && user?.role === 'customer';

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <VehicleImageGallery
          images={selectedVehicle.images}
          fallback={selectedVehicle.primary_image || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80'}
        />
        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={selectedVehicle.availability_status ? 'success' : 'danger'}>
                {selectedVehicle.availability_status ? 'Available now' : 'Unavailable'}
              </Badge>
              <Badge tone="brand">{selectedVehicle.vehicle_type}</Badge>
              <Badge>{selectedVehicle.fuel_type}</Badge>
            </div>
            <h1 className="mt-4 font-heading text-5xl text-ink">{selectedVehicle.vehicle_name}</h1>
            <p className="mt-2 text-lg text-slate-500">{selectedVehicle.brand}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-[2rem] bg-slate-50 p-5">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Fuel className="h-4 w-4 text-brand" />
              {selectedVehicle.fuel_type}
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Users className="h-4 w-4 text-brand" />
              {selectedVehicle.seating_capacity} seats
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Calendar className="h-4 w-4 text-brand" />
              Live availability
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <ShieldCheck className="h-4 w-4 text-brand" />
              Managed by {selectedVehicle.manager_name || 'fleet team'}
            </div>
          </div>

          <div className="rounded-[2rem] border border-brand/10 bg-brand p-6 text-white">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">Daily rate</p>
            <div className="mt-3 font-heading text-5xl">{formatCurrency(selectedVehicle.rental_price_per_day)}</div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="font-heading text-2xl text-ink">About this vehicle</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{selectedVehicle.description || 'No description available.'}</p>
          </div>

          {canBook ? (
            <BookingForm vehicle={selectedVehicle} availability={availability} disabled={!selectedVehicle.availability_status} />
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              Customer sign-in is required to book this vehicle.{' '}
              <Link to="/login" className="font-semibold text-brand">
                Sign in to continue.
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
