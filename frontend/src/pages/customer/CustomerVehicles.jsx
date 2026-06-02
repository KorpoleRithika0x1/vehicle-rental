import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';

import { fetchBookings } from '../../api/bookings';
import DashboardShell from '../../components/dashboard/DashboardShell';
import Loader from '../../components/common/Loader';
import Pagination from '../../components/common/Pagination';
import VehicleGrid from '../../components/vehicle/VehicleGrid';
import { useDebounce } from '../../hooks/useDebounce';
import { useVehicleStore } from '../../store/vehicleStore';
import { CUSTOMER_LINKS } from '../dashboard/CustomerDashboard';

const emptyFilters = {
  search: '',
  vehicle_type: '',
  brand: '',
  fuel_type: '',
  min_price: '',
  max_price: '',
  available_only: false,
  page: 1,
  page_size: 12,
};

export default function CustomerVehicles() {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const pagination = useVehicleStore((state) => state.pagination);
  const fetchVehicles = useVehicleStore((state) => state.fetchVehicles);

  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hasActiveBooking, setHasActiveBooking] = useState(false);
  const [localFilters, setLocalFilters] = useState(emptyFilters);

  const debouncedSearch = useDebounce(localFilters.search, 400);
  const fetchRef = useRef(fetchVehicles);
  fetchRef.current = fetchVehicles;

  // Check if customer has any approved booking (informational only)
  useEffect(() => {
    let ignore = false;
    fetchBookings({ status: 'approved', page_size: 1 })
      .then((data) => { if (!ignore) setHasActiveBooking((data.items || []).length > 0); })
      .catch(() => {});
    return () => { ignore = true; };
  }, []);

  // Fetch vehicles when filters change
  useEffect(() => {
    const merged = { ...localFilters, search: debouncedSearch };
    const apiParams = Object.fromEntries(
      Object.entries(merged).filter(([, v]) => v !== '' && v !== false && v !== null && v !== undefined)
    );
    let cancelled = false;
    setIsLoading(true);
    fetchRef.current(apiParams).finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [
    debouncedSearch,
    localFilters.vehicle_type,
    localFilters.brand,
    localFilters.fuel_type,
    localFilters.min_price,
    localFilters.max_price,
    localFilters.available_only,
    localFilters.page,
    localFilters.page_size,
  ]);

  const handleFilterChange = useCallback((field, value) => {
    setLocalFilters((c) => ({ ...c, [field]: value, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page) => {
    setLocalFilters((c) => ({ ...c, page }));
  }, []);

  const handleReset = useCallback(() => {
    setLocalFilters(emptyFilters);
  }, []);

  return (
    <DashboardShell
      title="Browse Vehicles"
      subtitle="Search and filter our full fleet. Click any vehicle to view details and book."
      links={CUSTOMER_LINKS}
    >
      <div className="space-y-6">
        {/* Search + filter bar */}
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 shrink-0 text-slate-400" />
            <input
              type="text"
              value={localFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by make, model, or features…"
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`rounded-lg p-2 transition ${showFilters ? 'bg-brand/10 text-brand' : 'text-slate-400 hover:text-brand'}`}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                <select
                  value={localFilters.vehicle_type}
                  onChange={(e) => handleFilterChange('vehicle_type', e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
                >
                  <option value="">All types</option>
                  <option value="car">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="van">Van</option>
                  <option value="truck">Scooty</option>
                  <option value="bike">Bike</option>
                </select>
                <select
                  value={localFilters.fuel_type}
                  onChange={(e) => handleFilterChange('fuel_type', e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
                >
                  <option value="">All fuel types</option>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                  <option value="hybrid">Hybrid</option>
                </select>
                <input
                  type="text"
                  value={localFilters.brand}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                  placeholder="Brand"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
                />
                <input
                  type="number"
                  min="0"
                  value={localFilters.min_price}
                  onChange={(e) => handleFilterChange('min_price', e.target.value)}
                  placeholder="Min price / day"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
                />
                <input
                  type="number"
                  min="0"
                  value={localFilters.max_price}
                  onChange={(e) => handleFilterChange('max_price', e.target.value)}
                  placeholder="Max price / day"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
                />
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localFilters.available_only}
                    onChange={(e) => handleFilterChange('available_only', e.target.checked)}
                  />
                  Available only
                </label>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="mt-3 text-xs font-semibold text-rose-500 hover:underline"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>

        {/* Active booking warning */}
        {hasActiveBooking && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span className="font-semibold">You have an active booking. </span>
            <span>You cannot book another vehicle for overlapping dates. </span>
            <Link to="/customer/bookings" className="font-semibold underline">View My Bookings</Link>
          </div>
        )}

        {/* Count */}
        {!isLoading && (
          <p className="text-sm font-semibold text-slate-500">
            Showing {pagination.total} vehicle{pagination.total !== 1 ? 's' : ''}
          </p>
        )}

        {/* Grid */}
        <VehicleGrid vehicles={vehicles} isLoading={isLoading} />

        {/* Pagination */}
        <Pagination
          page={pagination.page}
          totalPages={pagination.total_pages}
          onPageChange={handlePageChange}
        />
      </div>
    </DashboardShell>
  );
}
