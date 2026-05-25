import { X } from 'lucide-react';

import { useUiStore } from '../../store/uiStore';

export default function Modal() {
  const modal = useUiStore((state) => state.modal);
  const closeModal = useUiStore((state) => state.closeModal);

  if (!modal.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-2xl text-ink">{modal.title}</h3>
          <button type="button" onClick={closeModal} className="rounded-full bg-slate-100 p-2 text-slate-500 hover:text-brand">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div>{modal.content}</div>
      </div>
    </div>
  );
}
