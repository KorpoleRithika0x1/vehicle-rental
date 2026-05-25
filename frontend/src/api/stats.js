import { apiClient } from './client';

export async function fetchAdminStats() {
  const response = await apiClient.get('/stats/admin');
  return {
    ...response.data,
    cacheStatus: response.headers['x-cache'] || 'MISS',
  };
}

export async function fetchManagerStats() {
  const response = await apiClient.get('/stats/manager');
  return {
    ...response.data,
    cacheStatus: response.headers['x-cache'] || 'MISS',
  };
}

export async function fetchCustomerStats() {
  const { data } = await apiClient.get('/stats/customer');
  return data;
}
