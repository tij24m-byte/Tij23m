import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  title: string;
  description: string;
  type?: 'success' | 'info';
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-20 md:bottom-6 left-4 right-4 md:right-auto md:w-[390px] z-[60] flex flex-col gap-2.5 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="pointer-events-auto bg-[#04281B] text-white border border-[#D4AF37]/40 rounded-2xl p-4 shadow-xl shadow-[#04281B]/35 flex items-start gap-3 transition-all duration-200"
        >
          <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold text-white leading-snug">
              {toast.title}
            </p>
            <p className="text-xs text-emerald-100 mt-1 leading-relaxed font-mono-num">
              {toast.description}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="إغلاق الإشعار"
            className="min-h-[36px] min-w-[36px] rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
