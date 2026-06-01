import { Car, Fuel, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { formatCurrency } from '../../utils/formatCurrency';

const vehicleTypeLabels = {
  car: 'Sedan',
  suv: 'SUV',
  van: 'Van',
  truck: 'Scooty',
  bike: 'Bike',
};

export default function VehicleCard({ vehicle }) {
  const typeLabel = vehicleTypeLabels[vehicle.vehicle_type] || vehicle.vehicle_type;
  const stockCount = Number(vehicle.vehicle_count ?? 0);
  const stockBadge = !vehicle.availability_status || stockCount === 0
    ? { label: 'Out of Stock', className: 'bg-rose-600 text-white' }
    : stockCount === 1
      ? { label: 'Low Stock — 1 left', className: 'bg-amber-500 text-white' }
      : { label: 'Available', className: 'bg-emerald-600 text-white' };

  return (
    <Link to={`/vehicles/${vehicle.id}`} className="block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      {/* Image */}
      <div className="relative">
        <img
          src={vehicle.primary_image || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80'}
          alt={vehicle.vehicle_name}
          className="h-52 w-full object-cover"
          loading="lazy"
        />
        <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${stockBadge.className}`}>
          {stockBadge.label}
        </span>
        {/* Price overlay */}
        <div className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-3 py-1.5 text-sm font-bold text-white">
          {formatCurrency(vehicle.rental_price_per_day)}<span className="text-xs font-normal"> / day</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-ink">{vehicle.vehicle_name}</h3>
        <p className="mt-0.5 text-sm text-slate-400">{typeLabel} • {vehicle.brand}</p>

        <div className="mt-4 grid grid-cols-2 gap-y-2 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            {vehicle.seating_capacity} Seats
          </div>
          <div className="flex items-center gap-2">
            <Fuel className="h-4 w-4 text-slate-400" />
            <span className="capitalize">{vehicle.fuel_type}</span>
          </div>
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-slate-400" />
            <span className="capitalize">{typeLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400" />
            {vehicle.city || (stockCount > 0 && vehicle.availability_status ? `${stockCount} in stock` : 'Out of stock')}
          </div>
        </div>
      </div>
    </Link>
  );
}
