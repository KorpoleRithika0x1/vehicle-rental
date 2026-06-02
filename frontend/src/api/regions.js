import { apiClient } from './client';

export async function fetchManagersWithRegions() {
  const { data } = await apiClient.get('/admin/managers');
  return data;
}

export async function grantRegion(managerId, city) {
  const { data } = await apiClient.post(`/admin/managers/${managerId}/regions`, { city });
  return data;
}

export async function revokeRegion(managerId, city) {
  const { data } = await apiClient.delete(`/admin/managers/${managerId}/regions/${encodeURIComponent(city)}`);
  return data;
}

export async function fetchMyRegions() {
  const { data } = await apiClient.get('/manager/regions');
  return data; // string[]
}
