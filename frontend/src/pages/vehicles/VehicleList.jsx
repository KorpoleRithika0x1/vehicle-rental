import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';

import Pagination from '../../components/common/Pagination';
import VehicleGrid from '../../components/vehicle/VehicleGrid';
import { useDebounce } from '../../hooks/useDebounce';
import { useVehicleStore } from '../../store/vehicleStore';

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

export default function VehicleList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const vehicles = useVehicleStore((state) => state.vehicles);
  const pagination = useVehicleStore((state) => state.pagination);
  const fetchVehicles = useVehicleStore((state) => state.fetchVehicles);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [localFilters, setLocalFilters] = useState(() => ({
    ...emptyFilters,
    search: searchParams.get('search') || '',
    vehicle_type: searchParams.get('vehicle_type') || '',
    brand: searchParams.get('brand') || '',
    fuel_type: searchParams.get('fuel_type') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    available_only: searchParams.get('available_only') === 'true',
    page: Number(searchParams.get('page') || 1),
  }));

  const debouncedSearch = useDebounce(localFilters.search, 400);
  const fetchRef = useRef(fetchVehicles);
  fetchRef.current = fetchVehicles;

  useEffect(() => {
    const merged = { ...localFilters, search: debouncedSearch };
    const apiParams = Object.fromEntries(
      Object.entries(merged).filter(([, v]) => v !== '' && v !== false && v !== null && v !== undefined)
    );

    let cancelled = false;
    setIsLoading(true);
    fetchRef.current(apiParams).finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    const next = new URLSearchParams();
    ['search', 'vehicle_type', 'brand', 'fuel_type', 'min_price', 'max_price', 'available_only'].forEach((key) => {
      const val = merged[key];
      if (val !== '' && val !== false) next.set(key, val);
    });
    if (merged.page > 1) next.set('page', merged.page);
    setSearchParams(next, { replace: true });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="min-h-screen bg-white">
      {/* Hero header */}
      <div className="bg-[#eef2ff] px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-ink">Available Cars</h1>
        <p className="mt-3 text-slate-500">Browse our selection of premium vehicles available for your next adventure</p>

        {/* Search bar */}
        <div className="mx-auto mt-8 flex max-w-2xl items-center gap-3 rounded-full bg-white px-5 py-3 shadow-sm">
          <Search className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            type="text"
            value={localFilters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search by make, model, or features"
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="text-slate-400 hover:text-brand"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>

        {/* Expandable filters */}
        {showFilters && (
          <div className="mx-auto mt-4 max-w-2xl rounded-2xl bg-white p-5 shadow-sm text-left">
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              <select value={localFilters.vehicle_type} onChange={(e) => handleFilterChange('vehicle_type', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none">
                <option value="">All types</option>
                <option value="car">Sedan</option>
                <option value="suv">SUV</option>
                <option value="van">Van</option>
                <option value="truck">Scooty</option>
                <option value="bike">Bike</option>
              </select>
              <select value={localFilters.fuel_type} onChange={(e) => handleFilterChange('fuel_type', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none">
                <option value="">All fuel types</option>
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
              </select>
              <input type="text" value={localFilters.brand} onChange={(e) => handleFilterChange('brand', e.target.value)} placeholder="Brand" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
              <input type="number" min="0" value={localFilters.min_price} onChange={(e) => handleFilterChange('min_price', e.target.value)} placeholder="Min price / day" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
              <input type="number" min="0" value={localFilters.max_price} onChange={(e) => handleFilterChange('max_price', e.target.value)} placeholder="Max price / day" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-600">
                <input type="checkbox" checked={localFilters.available_only} onChange={(e) => handleFilterChange('available_only', e.target.checked)} />
                Available only
              </label>
            </div>
            <button type="button" onClick={handleReset} className="mt-3 text-xs font-semibold text-rose-500 hover:underline">
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {!isLoading && (
          <p className="mb-6 text-sm font-semibold text-slate-600">
            Showing {pagination.total} Car{pagination.total !== 1 ? 's' : ''}
          </p>
        )}
        <VehicleGrid vehicles={vehicles} isLoading={isLoading} />
        <Pagination page={pagination.page} totalPages={pagination.total_pages} onPageChange={handlePageChange} />
      </div>
    </div>
  );
}
