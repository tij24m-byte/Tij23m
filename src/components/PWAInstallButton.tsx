import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (!ok) setShowGuide(true);
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          compact
            ? 'min-h-[40px] px-3 py-2 rounded-xl bg-[#D4AF37] text-[#04281B] text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap shrink-0 hover:opacity-95 cursor-pointer'
            : 'min-h-[44px] px-4 py-2.5 rounded-xl bg-[#D4AF37] text-[#04281B] text-xs font-extrabold flex items-center justify-center gap-2 whitespace-nowrap shrink-0 hover:opacity-95 cursor-pointer shadow-sm'
        }
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>تثبيت التطبيق</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-[70] bg-[#041E15]/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="تثبيت التطبيق"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#0B1E17] border border-transparent dark:border-emerald-900/50 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-10 h-1.5 bg-slate-200 dark:bg-emerald-900 rounded-full mx-auto sm:hidden" />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl cbos-gradient text-[#D4AF37] flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0F1F18] dark:text-emerald-50">
                    تثبيت تطبيق بنك السودان المركزي
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-emerald-200/70">
                    يعمل كتطبيق مستقل بملء الشاشة مع أيقونة على الشاشة الرئيسية ودعم العمل دون اتصال
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="إغلاق"
                className="min-h-[44px] min-w-[44px] rounded-full bg-slate-100 dark:bg-emerald-950 flex items-center justify-center text-slate-700 dark:text-emerald-100 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isIOS ? (
              <div className="rounded-2xl bg-slate-50 dark:bg-[#112A21] border border-slate-200 dark:border-emerald-900/50 p-4 text-xs space-y-2 text-slate-700 dark:text-emerald-100 leading-relaxed">
                <p className="font-extrabold text-[#064E3B] dark:text-[#D4AF37]">
                  خطوات التثبيت على هواتف آيفون وآيباد:
                </p>
                <p>1. افتح رابط التطبيق في متصفح سفاري.</p>
                <p>2. اضغط على زر «مشاركة» في أسفل الشاشة.</p>
                <p>3. اختر «إضافة إلى الشاشة الرئيسية».</p>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-50 dark:bg-[#112A21] border border-slate-200 dark:border-emerald-900/50 p-4 text-xs space-y-2 text-slate-700 dark:text-emerald-100 leading-relaxed">
                <p className="font-extrabold text-[#064E3B] dark:text-[#D4AF37]">
                  خطوات التثبيت على هواتف أندرويد:
                </p>
                <p>1. افتح رابط التطبيق في متصفح غوغل كروم على هاتفك.</p>
                <p>2. اضغط على قائمة المتصفح (⋮) في أعلى الشاشة.</p>
                <p>3. اختر «تثبيت التطبيق» أو «الإضافة إلى الشاشة الرئيسية».</p>
                <p>4. ستُضاف أيقونة التطبيق إلى الشاشة الرئيسية مع اختصارات التحويل السريع والعمل دون اتصال.</p>
              </div>
            )}

            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 p-3 flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>التطبيق مهيّأ بالكامل للعمل على نظام أندرويد بوضع مستقل ودعم عدم الاتصال بالإنترنت.</span>
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full min-h-[48px] rounded-2xl cbos-gradient text-white text-sm font-extrabold cursor-pointer"
            >
              حسناً، إغلاق
            </button>
          </div>
        </div>
      )}
    </>
  );
};
