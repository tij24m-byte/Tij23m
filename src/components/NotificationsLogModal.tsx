import React from 'react';
import { Mail, MessageSquare, X } from 'lucide-react';
import { DispatchNotification } from '../types/bank';

interface NotificationsLogModalProps {
  isOpen: boolean;
  logs: DispatchNotification[];
  onClose: () => void;
}

export const NotificationsLogModal: React.FC<NotificationsLogModalProps> = ({
  isOpen,
  logs,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#041E15]/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="سجل رسائل SMS والبريد الإلكتروني"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-[#0B1E17] border border-transparent dark:border-emerald-900/50 rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="w-10 h-1.5 bg-slate-200 dark:bg-emerald-900 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-extrabold text-[#0F1F18] dark:text-emerald-50">
              سجل الإشعارات المرسلة (SMS والبريد الإلكتروني)
            </h2>
            <p className="text-xs text-slate-500 dark:text-emerald-200/70 mt-0.5">
              إشعارات التحويل الفورية، رسائل الترحيب، وتنبيهات كشوف الحساب الأسبوعية
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="min-h-[44px] min-w-[44px] rounded-full bg-slate-100 dark:bg-emerald-950 hover:bg-slate-200 dark:hover:bg-emerald-900 flex items-center justify-center text-slate-700 dark:text-emerald-100 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500 dark:text-emerald-200/70">
            لا توجد رسائل مسجلة بعد.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-emerald-900/40">
            {logs.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    item.kind === 'SMS'
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-[#064E3B] dark:text-emerald-300'
                      : 'bg-amber-50 dark:bg-amber-950/50 text-[#B48A1E] dark:text-[#D4AF37]'
                  }`}
                >
                  {item.kind === 'SMS' ? (
                    <MessageSquare className="w-5 h-5" />
                  ) : (
                    <Mail className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-extrabold text-[#0F1F18] dark:text-emerald-50">
                      {item.subject}
                    </span>
                    <span className="text-[11px] font-mono-num text-slate-400 dark:text-emerald-200/60">
                      {item.kind} · {item.timestamp}
                    </span>
                  </div>
                  <div
                    dir="ltr"
                    className="text-xs font-mono-num text-[#064E3B] dark:text-[#D4AF37] text-right mt-0.5"
                  >
                    {item.recipient}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-emerald-100/80 mt-1.5 leading-relaxed whitespace-pre-line">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
