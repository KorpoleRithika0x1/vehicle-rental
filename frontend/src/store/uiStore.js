import { create } from 'zustand';

let toastId = 0;

export const useUiStore = create((set) => ({
  isLoading: false,
  toast: [],
  modal: { isOpen: false, title: '', content: null },
  setLoading: (value) => set({ isLoading: value }),
  showToast: (payload) =>
    set((state) => ({
      toast: [...state.toast, { id: ++toastId, type: payload.type || 'info', message: payload.message }],
    })),
  dismissToast: (id) => set((state) => ({ toast: state.toast.filter((item) => item.id !== id) })),
  openModal: (payload) => set({ modal: { isOpen: true, title: payload.title, content: payload.content } }),
  closeModal: () => set({ modal: { isOpen: false, title: '', content: null } }),
}));
