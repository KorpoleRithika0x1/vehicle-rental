import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import Loader from '../../components/common/Loader';
import BookingForm from '../../components/booking/BookingForm';
import VehicleImageGallery from '../../components/vehicle/VehicleImageGallery';
import { useVehicleStore } from '../../store/vehicleStore';
import { formatCurrency } from '../../utils/formatCurrency';

export default function BookingConfirm() {
  const { id } = useParams();
  const { selectedVehicle, availability, fetchVehicle, fetchAvailability } = useVehicleStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function loadVehicle() {
      setIsLoading(true);
      try {
        await Promise.all([fetchVehicle(id), fetchAvailability(id)]);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    loadVehicle();
    return () => {
      ignore = true;
    };
  }, [fetchAvailability, fetchVehicle, id]);

  if (isLoading || !selectedVehicle) {
    return <Loader label="Loading booking workspace..." fullScreen />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1fr_0.95fr]">
        <div className="space-y-6">
          <VehicleImageGallery
            images={selectedVehicle.images}
            fallback={selectedVehicle.primary_image || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80'}
          />
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
            <h1 className="font-heading text-4xl text-ink">{selectedVehicle.vehicle_name}</h1>
            <p className="mt-2 text-slate-500">{selectedVehicle.brand}</p>
            <div className="mt-4 text-3xl font-semibold text-brand">{formatCurrency(selectedVehicle.rental_price_per_day)} / day</div>
          </div>
        </div>
        <BookingForm vehicle={selectedVehicle} availability={availability} disabled={!selectedVehicle.availability_status} />
      </div>
    </div>
  );
}
