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
    const data = await fetchVehicles(mergedFilters);
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
