import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import Pagination from '../../components/common/Pagination';
import VehicleFilters from '../../components/vehicle/VehicleFilters';
import VehicleGrid from '../../components/vehicle/VehicleGrid';
import { useDebounce } from '../../hooks/useDebounce';
import { useVehicleStore } from '../../store/vehicleStore';

export default function VehicleList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const vehicles = useVehicleStore((state) => state.vehicles);
  const pagination = useVehicleStore((state) => state.pagination);
  const fetchVehicles = useVehicleStore((state) => state.fetchVehicles);
  const [isLoading, setIsLoading] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    search: searchParams.get('search') || '',
    vehicle_type: searchParams.get('vehicle_type') || '',
    brand: searchParams.get('brand') || '',
    fuel_type: searchParams.get('fuel_type') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    available_only: searchParams.get('available_only') === 'true',
    page: Number(searchParams.get('page') || 1),
    page_size: Number(searchParams.get('page_size') || 12),
  });

  const debouncedSearch = useDebounce(localFilters.search, 400);

  const requestFilters = useMemo(
    () => ({ ...localFilters, search: debouncedSearch }),
    [localFilters, debouncedSearch]
  );

  const syncQueryParams = useCallback(
    (filters) => {
      const next = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== false && value !== null && value !== undefined) {
          next.set(key, value);
        }
      });
      setSearchParams(next);
    },
    [setSearchParams]
  );

  useEffect(() => {
    let ignore = false;

    async function loadVehicles() {
      setIsLoading(true);
      try {
        await fetchVehicles(requestFilters);
        if (!ignore) {
          syncQueryParams(requestFilters);
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadVehicles();
    return () => {
      ignore = true;
    };
  }, [fetchVehicles, requestFilters, syncQueryParams]);

  const handleFilterChange = useCallback((field, value) => {
    setLocalFilters((current) => ({ ...current, [field]: value, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page) => {
    setLocalFilters((current) => ({ ...current, page }));
  }, []);

  const handleReset = useCallback(() => {
    setLocalFilters({
      search: '',
      vehicle_type: '',
      brand: '',
      fuel_type: '',
      min_price: '',
      max_price: '',
      available_only: false,
      page: 1,
      page_size: 12,
    });
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Available Fleet</p>
          <h1 className="mt-4 font-heading text-5xl text-ink">Browse live vehicle availability.</h1>
        </div>
        <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
          Cache: <span className="font-semibold text-brand">{pagination.cacheStatus}</span>
        </div>
      </div>

      <VehicleFilters filters={localFilters} onChange={handleFilterChange} onReset={handleReset} />

      <div className="mt-10">
        <VehicleGrid vehicles={vehicles} isLoading={isLoading} />
      </div>

      <Pagination page={pagination.page} totalPages={pagination.total_pages} onPageChange={handlePageChange} />
    </div>
  );
}
