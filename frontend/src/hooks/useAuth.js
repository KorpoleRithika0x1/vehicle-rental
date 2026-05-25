import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const store = useAuthStore();
  return store;
}
