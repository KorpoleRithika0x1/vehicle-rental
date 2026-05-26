import { create } from 'zustand';

import { fetchVehicle, fetchVehicleAvailability, fetchVehicles } from '../api/vehicles';

const defaultFilters = {
  search: '',
  vehicle_type: '',
  brand: '',
  fuel_type: '',
  min_price: '',
  max_price: '',
  available_only: false,
};

export const useVehicleStore = create((set, get) => ({
  vehicles: [],
  selectedVehicle: null,
  availability: null,
  filters: defaultFilters,
  pagination: { total: 0, page: 1, page_size: 12, total_pages: 1, cacheStatus: 'MISS' },
  fetchVehicles: async (params = {}) => {
    const mergedFilters = { ...get().filters, ...params };
    // Strip empty/false values before sending to API
    const cleanParams = Object.fromEntries(
      Object.entries(mergedFilters).filter(([, v]) => v !== '' && v !== false && v !== null && v !== undefined)
    );
    const data = await fetchVehicles(cleanParams);
    set({
      vehicles: data.items,
      filters: mergedFilters,
      pagination: {
        total: data.total,
        page: data.page,
        page_size: data.page_size,
        total_pages: data.total_pages,
        cacheStatus: data.cacheStatus,
      },
    });
    return data;
  },
  fetchVehicle: async (vehicleId) => {
    const vehicle = await fetchVehicle(vehicleId);
    set({ selectedVehicle: vehicle });
    return vehicle;
  },
  fetchAvailability: async (vehicleId, params) => {
    const availability = await fetchVehicleAvailability(vehicleId, params);
    set({ availability });
    return availability;
  },
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: defaultFilters }),
}));
