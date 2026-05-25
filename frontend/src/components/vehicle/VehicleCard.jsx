import { CarFront, Fuel, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import Badge from '../common/Badge';
import { formatCurrency } from '../../utils/formatCurrency';

export default function VehicleCard({ vehicle, showManager = false }) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-soft transition hover:-translate-y-1">
      <img
        src={vehicle.primary_image || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80'}
        alt={vehicle.vehicle_name}
        className="h-56 w-full object-cover"
        loading="lazy"
      />
      <div className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-heading text-2xl text-ink">{vehicle.vehicle_name}</h3>
            <p className="text-sm text-slate-500">{vehicle.brand}</p>
          </div>
          <Badge tone={vehicle.availability_status ? 'success' : 'danger'}>
            {vehicle.availability_status ? 'Available' : 'Unavailable'}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge tone="brand">{vehicle.vehicle_type}</Badge>
          <Badge>{vehicle.fuel_type}</Badge>
          {showManager && <Badge>Manager #{vehicle.manager_id}</Badge>}
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <CarFront className="h-4 w-4 text-brand" />
            {vehicle.vehicle_type}
          </div>
          <div className="flex items-center gap-2">
            <Fuel className="h-4 w-4 text-brand" />
            {vehicle.fuel_type}
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-brand" />
            {vehicle.seating_capacity} seats
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Daily Rate</p>
            <p className="text-2xl font-semibold text-brand">{formatCurrency(vehicle.rental_price_per_day)}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/vehicles/${vehicle.id}`} className="rounded-full border border-brand/20 px-4 py-2 text-sm font-semibold text-brand">
              View Details
            </Link>
            <Link to={`/vehicles/${vehicle.id}/book`} className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
