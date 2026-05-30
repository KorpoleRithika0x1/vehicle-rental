import { create } from 'zustand';

import { fetchProfile, login as loginRequest, register as registerRequest, registerCustomer as registerCustomerRequest, updateProfile as updateProfileRequest } from '../api/auth';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../utils/tokenStorage';
import { useUiStore } from './uiStore';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: getAccessToken(),
  refreshToken: getRefreshToken(),
  isAuthenticated: Boolean(getAccessToken()),
  isReady: false,
  initializeAuth: async () => {
    const token = getAccessToken();
    if (!token) {
      set({ isReady: true });
      return;
    }
    try {
      const user = await fetchProfile();
      set({ user, token, refreshToken: getRefreshToken(), isAuthenticated: true, isReady: true });
    } catch (error) {
      clearTokens();
      set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isReady: true });
    }
  },
  login: async (payload) => {
    const data = await loginRequest(payload);
    setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token });
    set({
      user: data.user,
      token: data.access_token,
      refreshToken: data.refresh_token,
      isAuthenticated: true,
      isReady: true,
    });
    useUiStore.getState().showToast({ type: 'success', message: `Welcome back, ${data.user.name}.` });
    return data;
  },
  register: async (payload) => {
    const data = await registerRequest(payload);
    setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token });
    set({
      user: data.user,
      token: data.access_token,
      refreshToken: data.refresh_token,
      isAuthenticated: true,
      isReady: true,
    });
    useUiStore.getState().showToast({ type: 'success', message: 'Your account is ready to book.' });
    return data;
  },
  registerCustomer: async (payload) => {
    // Submits license + live photo; backend returns 201 with no JWT
    const data = await registerCustomerRequest(payload);
    return data;
  },
  logout: () => {
    clearTokens();
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isReady: true });
  },
  hydrateProfile: async () => {
    const user = await fetchProfile();
    set({ user });
    return user;
  },
  updateProfile: async (payload) => {
    const user = await updateProfileRequest(payload);
    set({ user });
    useUiStore.getState().showToast({ type: 'success', message: 'Profile updated successfully.' });
    return user;
  },
}));
