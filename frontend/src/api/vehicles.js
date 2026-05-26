import { apiClient } from './client';

export async function fetchVehicles(params) {
  const response = await apiClient.get('/vehicles', { params });
  return {
    ...response.data,
    cacheStatus: response.headers['x-cache'] || 'MISS',
  };
}

export async function fetchVehicle(id) {
  const response = await apiClient.get(`/vehicles/${id}`);
  return {
    ...response.data,
    cacheStatus: response.headers['x-cache'] || 'MISS',
  };
}

export async function fetchVehicleAvailability(id, params) {
  const response = await apiClient.get(`/vehicles/${id}/availability`, { params });
  return {
    ...response.data,
    cacheStatus: response.headers['x-cache'] || 'MISS',
  };
}

export async function createVehicle(payload) {
  const { data } = await apiClient.post('/vehicles', payload);
  return data;
}

export async function updateVehicle(id, payload) {
  const { data } = await apiClient.put(`/vehicles/${id}`, payload);
  return data;
}

export async function deleteVehicle(id) {
  const { data } = await apiClient.delete(`/vehicles/${id}`);
  return data;
}

export async function addVehicleImage(id, payload) {
  const { data } = await apiClient.post(`/vehicles/${id}/images`, payload);
  return data;
}

export async function uploadVehicleImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post('/vehicles/images/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
