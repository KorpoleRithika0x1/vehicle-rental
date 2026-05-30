import { apiClient } from './client';

export async function fetchVerificationQueue({ page = 1, page_size = 20 } = {}) {
  const { data } = await apiClient.get('/verification/queue', { params: { page, page_size } });
  return data;
}

export async function approveAccount(userId) {
  const { data } = await apiClient.put(`/verification/${userId}/approve`);
  return data;
}

export async function rejectAccount(userId, reason) {
  const { data } = await apiClient.put(`/verification/${userId}/reject`, { reason });
  return data;
}

export async function fetchVerificationStats() {
  const { data } = await apiClient.get('/verification/stats');
  return data;
}
