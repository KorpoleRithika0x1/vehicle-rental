import { apiClient } from './client';

export async function login(payload) {
  const { data } = await apiClient.post('/auth/login', payload);
  return data;
}

export async function register(payload) {
  const { data } = await apiClient.post('/auth/register', payload);
  return data;
}

export async function registerCustomer(payload) {
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('email', payload.email);
  formData.append('password', payload.password);
  if (payload.phone_number) formData.append('phone_number', payload.phone_number);
  formData.append('license_image', payload.license_image);
  formData.append('live_photo', payload.live_photo);
  const { data } = await apiClient.post('/auth/register/customer', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function fetchProfile() {
  const { data } = await apiClient.get('/auth/profile');
  return data;
}

export async function updateProfile(payload) {
  const { data } = await apiClient.put('/auth/profile', payload);
  return data;
}

export async function uploadProfileImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post('/auth/profile/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function uploadLicenseDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post('/auth/profile/license-document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function changePassword(payload) {
  const { data } = await apiClient.put('/auth/profile/password', payload);
  return data;
}
