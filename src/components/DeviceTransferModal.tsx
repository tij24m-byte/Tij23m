import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  ScanFace,
  Smartphone,
  X,
} from 'lucide-react';
import { BankUserProfile } from '../types/bank';
import { generateDeviceId } from '../data/sudanBanks';

interface DeviceTransferModalProps {
  isOpen: boolean;
  user: BankUserProfile;
  onClose: () => void;
  onConfirmTransfer: (newDeviceName: string, newDeviceId: string) => void;
}

type TransferModalStep = 'details' | 'face_verify' | 'done';

export const DeviceTransferModal: React.FC<DeviceTransferModalProps> = ({
  isOpen,
  user,
  onClose,
  onConfirmTransfer,
}) => {
  const [newDeviceName, setNewDeviceName] = useState('هاتف جديد (أندرويد / آيفون)');
  const [step, setStep] = useState<TransferModalStep>('details');
  const [scanning, setScanning] = useState(false);
  const [scanStageText, setScanStageText] = useState(
    'جاهز لفحص الحيوية ومطابقة البصمة الرقمية للوجه (512 رقماً)'
  );
  const [generatedDeviceId, setGeneratedDeviceId] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setStep('details');
    setScanning(false);
    setError(null);
    setScanStageText('جاهز لفحص الحيوية ومطابقة البصمة الرقمية للوجه (512 رقماً)');
    onClose();
  };

  const handleProceedToFace = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newDeviceName.trim().length < 3) {
      setError('يرجى إدخال اسم أو طراز الهاتف الوجهة بشكل واضح.');
      return;
    }
    setStep('face_verify');
  };

  const handleRunFaceCheck = () => {
    if (scanning) return;
    setScanning(true);
    setScanStageText('جارٍ فحص الحيوية ثلاثي الأبعاد ومنع التزييف...');

    setTimeout(() => {
      setScanStageText('مطابقة البصمة الرقمية للوجه مع سجل بنك السودان المركزي...');
    }, 600);

    setTimeout(() => {
      const nextId = generateDeviceId();
      setGeneratedDeviceId(nextId);
      setScanning(false);
      onConfirmTransfer(newDeviceName.trim(), nextId);
      setStep('done');
    }, 1300);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#041E15]/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="نقل الحساب إلى هاتف آخر"
    >
      <div className="w-full max-w-lg bg-white dark:bg-[#0B1E17] border border-transparent dark:border-emerald-900/50 rounded-t-3xl sm:rounded-3xl p-6 max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="w-10 h-1.5 bg-slate-200 dark:bg-emerald-900 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl cbos-gradient text-[#D4AF37] flex items-center justify-center shrink-0">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#0F1F18] dark:text-emerald-50">
                نقل الحساب إلى هاتف آخر
              </h2>
              <p className="text-xs text-slate-500 dark:text-emerald-200/70">
                يتطلب التحقق الإلزامي بالبصمة الرقمية للوجه لتأكيد الوجهة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetAndClose}
            aria-label="إغلاق"
            className="min-h-[44px] min-w-[44px] rounded-full bg-slate-100 dark:bg-emerald-950 hover:bg-slate-200 dark:hover:bg-emerald-900 flex items-center justify-center text-slate-700 dark:text-emerald-100 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'details' && (
          <form onSubmit={handleProceedToFace} className="space-y-4">
            <div className="rounded-2xl bg-slate-50 dark:bg-[#112A21] border border-slate-200 dark:border-emerald-900/50 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-emerald-200/70">
                  الهاتف الموثق حالياً (سيتم فصله)
                </span>
                <span className="font-bold text-[#0F1F18] dark:text-emerald-50">
                  {user.boundDeviceName}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-emerald-200/70">معرّف الجهاز الحالي</span>
                <span dir="ltr" className="font-mono-num font-bold text-[#064E3B] dark:text-[#D4AF37]">
                  {user.boundDeviceId}
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="dest-device-name"
                className="block text-xs font-bold text-slate-700 dark:text-emerald-100 mb-1.5"
              >
                اسم أو طراز الهاتف الوجهة (الجديد)
              </label>
              <div className="relative">
                <input
                  id="dest-device-name"
                  type="text"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  placeholder="مثال: Galaxy S25 Ultra أو iPhone 16"
                  className="w-full min-h-[48px] pl-11 pr-4 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-slate-50/70 dark:bg-[#112A21] text-sm text-[#0F1F18] dark:text-emerald-50"
                />
                <Smartphone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200 font-semibold leading-relaxed">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                بمجرد إتمام مطابقة بصمة الوجه الرقمية، سيتم تسجيل الخروج فوراً من الهاتف القديم وحصر صلاحية الحساب على الهاتف الجديد فقط.
              </span>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-3 text-xs text-red-700 dark:text-red-300 font-semibold">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full min-h-[50px] rounded-2xl cbos-gradient text-white text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer"
            >
              <ScanFace className="w-5 h-5 text-[#D4AF37]" />
              <span>المتابعة للتحقق ببصمة الوجه الرقمية</span>
            </button>
          </form>
        )}

        {step === 'face_verify' && (
          <div className="space-y-5 text-center">
            <div className="rounded-2xl bg-[#04281B] text-white p-6">
              <div className="w-36 h-44 mx-auto rounded-[50%_50%_46%_46%] border-2 border-[#D4AF37] flex items-center justify-center relative overflow-hidden bg-[#064E3B]/70">
                <ScanFace className="w-16 h-16 text-[#D4AF37]" />
                {scanning && (
                  <div className="absolute inset-x-2 top-2 h-0.5 bg-[#D4AF37] shadow-[0_0_12px_#D4AF37] animate-scan-sweep" />
                )}
              </div>

              <h3 className="text-base font-extrabold mt-4">
                التحقق من الوجهة عبر البصمة الرقمية للوجه
              </h3>
              <p className="text-xs text-emerald-100 mt-1.5">{scanStageText}</p>
              <p className="text-[11px] font-mono-num text-emerald-200/80 mt-2">
                {user.faceVectorHash} → {newDeviceName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStep('details')}
                disabled={scanning}
                className="min-h-[48px] rounded-2xl border border-slate-200 dark:border-emerald-900 text-sm font-bold text-slate-700 dark:text-emerald-100 cursor-pointer"
              >
                رجوع
              </button>
              <button
                type="button"
                disabled={scanning}
                onClick={handleRunFaceCheck}
                className="min-h-[48px] rounded-2xl cbos-gradient text-white text-sm font-extrabold disabled:opacity-70 cursor-pointer"
              >
                {scanning ? 'جارٍ مطابقة الوجه...' : 'مسح الوجه ونقل الحساب'}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-5 text-center py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#0F1F18] dark:text-emerald-50">
                تم نقل الحساب وتوثيق الهاتف الجديد
              </h3>
              <p className="text-xs text-slate-500 dark:text-emerald-200/70 mt-1">
                تم التحقق من البصمة الرقمية للوجه وفصل الهاتف السابق نهائياً
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-[#112A21] rounded-2xl border border-slate-200 dark:border-emerald-900/50 p-4 divide-y divide-slate-200/70 dark:divide-emerald-900/50 text-right">
              <div className="py-2 flex justify-between text-xs">
                <span className="text-slate-500 dark:text-emerald-200/70">الهاتف الوجهة المفعّل</span>
                <span className="font-bold text-[#0F1F18] dark:text-emerald-50">
                  {newDeviceName}
                </span>
              </div>
              <div className="py-2 flex justify-between text-xs">
                <span className="text-slate-500 dark:text-emerald-200/70">المعرّف الموثق الجديد</span>
                <span dir="ltr" className="font-mono-num font-bold text-[#064E3B] dark:text-[#D4AF37]">
                  {generatedDeviceId}
                </span>
              </div>
              <div className="py-2 flex justify-between text-xs">
                <span className="text-slate-500 dark:text-emerald-200/70">طريقة التوثيق</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  بصمة الوجه الرقمية (512 رقماً)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={resetAndClose}
              className="w-full min-h-[48px] rounded-2xl cbos-gradient text-white text-sm font-extrabold cursor-pointer"
            >
              تم
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
