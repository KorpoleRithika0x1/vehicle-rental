import axios from 'axios';

import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../utils/tokenStorage';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
});

let refreshPromise = null;

async function refreshSession() {
  if (!refreshPromise) {
    const refreshToken = getRefreshToken();
    refreshPromise = axios
      .post(`${baseURL}/auth/refresh`, { refresh_token: refreshToken })
      .then((response) => {
        const { access_token: accessToken, refresh_token: nextRefreshToken } = response.data;
        setTokens({ accessToken, refreshToken: nextRefreshToken });
        return accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      getRefreshToken() &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      try {
        originalRequest._retry = true;
        const accessToken = await refreshSession();
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        clearTokens();
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      }
    }

    const payload = error.response?.data;
    const message =
      payload?.message ||
      payload?.detail ||
      error.message ||
      'Something went wrong. Please try again.';

    return Promise.reject({
      ...error,
      normalizedMessage: message,
      normalizedDetail: payload?.detail || null,
      statusCode: error.response?.status || 500,
    });
  }
);
