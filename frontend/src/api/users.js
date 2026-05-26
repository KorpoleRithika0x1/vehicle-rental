import { apiClient } from './client';

export async function fetchUsers(params) {
  const { data } = await apiClient.get('/users', { params });
  return data;
}

export async function updateUserRole(id, payload) {
  const { data } = await apiClient.put(`/users/${id}/role`, payload);
  return data;
}

export async function deactivateUser(id) {
  const { data } = await apiClient.delete(`/users/${id}`);
  return data;
}

export async function updateUserStatus(id, payload) {
  const { data } = await apiClient.put(`/users/${id}/status`, payload);
  return data;
}
