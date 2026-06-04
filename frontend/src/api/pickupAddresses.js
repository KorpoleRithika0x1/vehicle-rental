import { apiClient } from './client';

export async function fetchPickupAddresses(city) {
  const { data } = await apiClient.get('/regions/pickup-addresses', {
    params: city ? { city } : undefined,
  });
  return data;
}
