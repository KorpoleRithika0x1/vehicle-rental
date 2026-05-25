import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useEffect } from 'react';

import { useToast } from '../../hooks/useToast';

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export default function ToastContainer() {
  const { toast, dismissToast } = useToast();

  useEffect(() => {
    if (!toast.length) return undefined;
    const timers = toast.map((item) => window.setTimeout(() => dismissToast(item.id), 4000));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [toast, dismissToast]);

  return (
    <div className="fixed right-4 top-20 z-50 flex w-full max-w-sm flex-col gap-3">
      {toast.map((item) => {
        const Icon = icons[item.type] || Info;
        return (
          <div key={item.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
            <Icon className={`mt-0.5 h-5 w-5 ${item.type === 'error' ? 'text-rose-500' : item.type === 'success' ? 'text-emerald-500' : 'text-brand'}`} />
            <p className="flex-1 text-sm text-slate-700">{item.message}</p>
            <button type="button" onClick={() => dismissToast(item.id)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
