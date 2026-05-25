import { useUiStore } from '../store/uiStore';

export function useToast() {
  const showToast = useUiStore((state) => state.showToast);
  const dismissToast = useUiStore((state) => state.dismissToast);
  const toast = useUiStore((state) => state.toast);
  return { toast, showToast, dismissToast };
}
