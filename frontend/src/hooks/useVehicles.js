import { useEffect } from 'react';

import { useVehicleStore } from '../store/vehicleStore';

export function useVehicles(params) {
  const store = useVehicleStore();

  useEffect(() => {
    store.fetchVehicles(params);
  }, [params.page, params.page_size, params.search, params.vehicle_type, params.brand, params.fuel_type, params.min_price, params.max_price, params.available_only]);

  return store;
}
