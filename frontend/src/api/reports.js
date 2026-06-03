import { apiClient } from './client';

export async function fetchRegionReport(city) {
  const { data } = await apiClient.get(`/reports/region/${encodeURIComponent(city)}`);
  return data;
}
