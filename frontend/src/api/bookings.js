import { apiClient } from './client';

export async function createBooking(payload) {
  const { data } = await apiClient.post('/bookings', payload);
  return data;
}

export async function fetchBookings(params) {
  const { data } = await apiClient.get('/bookings', { params });
  return data;
}

export async function fetchBooking(id) {
  const { data } = await apiClient.get(`/bookings/${id}`);
  return data;
}

export async function cancelBookingRequest(id) {
  const { data } = await apiClient.put(`/bookings/${id}/cancel`);
  return data;
}

export async function approveBookingRequest(id) {
  const { data } = await apiClient.put(`/bookings/${id}/approve`);
  return data;
}

export async function rejectBookingRequest(id) {
  const { data } = await apiClient.put(`/bookings/${id}/reject`);
  return data;
}

export async function completeBookingRequest(id) {
  const { data } = await apiClient.put(`/bookings/${id}/complete`);
  return data;
}
