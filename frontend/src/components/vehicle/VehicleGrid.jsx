import Loader from '../common/Loader';
import VehicleCard from './VehicleCard';

export default function VehicleGrid({ vehicles, isLoading = false, showManager = false }) {
  if (isLoading) {
    return <Loader label="Fetching curated fleet..." />;
  }

  if (!vehicles.length) {
    return (
      <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
        No vehicles matched the current filters.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {vehicles.map((vehicle) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} showManager={showManager} />
      ))}
    </div>
  );
}
