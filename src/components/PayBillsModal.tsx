import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Receipt, WifiOff, X } from 'lucide-react';
import { formatSdg } from '../data/sudanBanks';

interface PayBillsModalProps {
  isOpen: boolean;
  availableBalance: number;
  isOffline: boolean;
  onClose: () => void;
  onPayBill: (payload: {
    providerName: string;
    accountRef: string;
    amount: number;
  }) => void;
}

const BILL_PROVIDERS = [
  { id: 'nec', name: 'الهيئة القومية للكهرباء (شراء كهرباء)', code: 'ELEC-SD' },
  { id: 'water', name: 'هيئة مياه ولاية الخرطوم', code: 'WATR-SD' },
  { id: 'zain', name: 'شركة زين السودان للاتصالات', code: 'ZAIN-SD' },
  { id: 'sudani', name: 'شركة سوداني للاتصالات', code: 'SUDN-SD' },
  { id: 'mtn', name: 'شركة إم تي إن السودان (MTN)', code: 'MTN-SD' },
  { id: 'e15', name: 'نظام التحصيل الإلكتروني (إيصالي - E15)', code: 'E15-GOV' },
];

export const PayBillsModal: React.FC<PayBillsModalProps> = ({
  isOpen,
  availableBalance,
  isOffline,
  onClose,
  onPayBill,
}) => {
  const [providerId, setProviderId] = useState(BILL_PROVIDERS[0].id);
  const [billReference, setBillReference] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [paidSuccess, setPaidSuccess] = useState(false);

  if (!isOpen) return null;

  const selectedProvider =
    BILL_PROVIDERS.find((p) => p.id === providerId) ?? BILL_PROVIDERS[0];

  const resetAndClose = () => {
    setError(null);
    setPaidSuccess(false);
    setAmountInput('');
    setBillReference('');
    onClose();
  };

  const handleFillSample = () => {
    setBillReference(providerId === 'nec' ? '04129876543' : '249912345678');
    setAmountInput('45000');
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const numericAmount = Number(amountInput);

    if (billReference.trim().length < 5) {
      setError('يرجى إدخال رقم العداد أو رقم الاشتراك أو رقم الفاتورة بشكل صحيح.');
      return;
    }
    if (!numericAmount || numericAmount <= 0) {
      setError('يرجى إدخال مبلغ صحيح بالجنيه السوداني.');
      return;
    }
    if (numericAmount > availableBalance) {
      setError('الرصيد المتاح غير كافٍ لسداد هذه الفاتورة.');
      return;
    }

    onPayBill({
      providerName: selectedProvider.name,
      accountRef: billReference.trim(),
      amount: numericAmount,
    });
    setPaidSuccess(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#041E15]/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="دفع فواتير"
    >
      <div className="w-full max-w-lg bg-white dark:bg-[#0B1E17] border border-transparent dark:border-emerald-900/50 rounded-t-3xl sm:rounded-3xl p-6 max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="w-10 h-1.5 bg-slate-200 dark:bg-emerald-900 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl cbos-gradient text-[#D4AF37] flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#0F1F18] dark:text-emerald-50">
                دفع فواتير
              </h2>
              <p className="text-xs text-slate-500 dark:text-emerald-200/70">
                الرصيد المتاح:{' '}
                <span className="font-mono-num font-bold text-[#0F1F18] dark:text-emerald-100">
                  {formatSdg(availableBalance)} ج.س
                </span>
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

        {!paidSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isOffline && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3 flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-200">
                <WifiOff className="w-4 h-4 shrink-0" />
                <span>أنت غير متصل: سيتم حفظ سداد الفاتورة وإرسالها فور عودة الإنترنت.</span>
              </div>
            )}

            <div>
              <label
                htmlFor="bill-provider"
                className="block text-xs font-bold text-slate-700 dark:text-emerald-100 mb-1.5"
              >
                الجهة أو مقدم الخدمة
              </label>
              <select
                id="bill-provider"
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-slate-50/70 dark:bg-[#112A21] text-sm font-semibold text-[#0F1F18] dark:text-emerald-50"
              >
                {BILL_PROVIDERS.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="bill-reference"
                  className="text-xs font-bold text-slate-700 dark:text-emerald-100"
                >
                  رقم العداد / رقم الهاتف / رقم الفاتورة
                </label>
                <button
                  type="button"
                  onClick={handleFillSample}
                  className="text-[11px] font-bold text-[#064E3B] dark:text-[#D4AF37] hover:underline cursor-pointer"
                >
                  تعبئة بيانات تجريبية
                </button>
              </div>
              <input
                id="bill-reference"
                type="text"
                dir="ltr"
                value={billReference}
                onChange={(e) => setBillReference(e.target.value)}
                placeholder="04129876543"
                className="w-full min-h-[46px] px-4 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-slate-50/70 dark:bg-[#112A21] text-sm font-mono-num text-right text-[#0F1F18] dark:text-emerald-50"
              />
            </div>

            <div>
              <label
                htmlFor="bill-amount"
                className="block text-xs font-bold text-slate-700 dark:text-emerald-100 mb-1.5"
              >
                المبلغ المطلوب سداده (بالجنيه السوداني)
              </label>
              <input
                id="bill-amount"
                type="number"
                min={100}
                step="any"
                dir="ltr"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="45000"
                className="w-full min-h-[48px] px-4 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-slate-50/70 dark:bg-[#112A21] text-base font-extrabold font-mono-num text-right text-[#0F1F18] dark:text-emerald-50"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-3 flex items-start gap-2 text-xs text-red-700 dark:text-red-300 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full min-h-[50px] rounded-2xl cbos-gradient text-white text-sm font-extrabold flex items-center justify-center gap-2 hover:opacity-95 cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-[#D4AF37]" />
              <span>دفع فواتير</span>
            </button>
          </form>
        ) : (
          <div className="space-y-5 text-center py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#0F1F18] dark:text-emerald-50">
                {isOffline ? 'تم حفظ سداد الفاتورة للمزامنة' : 'تم سداد الفاتورة بنجاح'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-emerald-200/70 mt-1">
                تم خصم المبلغ وتقييد العملية في سجل المعاملات
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-[#112A21] rounded-2xl border border-slate-200 dark:border-emerald-900/50 p-4 divide-y divide-slate-200/70 dark:divide-emerald-900/50 text-right">
              <div className="py-2 flex justify-between text-xs">
                <span className="text-slate-500 dark:text-emerald-200/70">الجهة</span>
                <span className="font-bold text-[#0F1F18] dark:text-emerald-50">
                  {selectedProvider.name}
                </span>
              </div>
              <div className="py-2 flex justify-between text-xs">
                <span className="text-slate-500 dark:text-emerald-200/70">رقم المرجع</span>
                <span dir="ltr" className="font-mono-num font-bold text-[#0F1F18] dark:text-emerald-50">
                  {billReference}
                </span>
              </div>
              <div className="py-2 flex justify-between text-xs">
                <span className="text-slate-500 dark:text-emerald-200/70">المبلغ المدفوع</span>
                <span dir="ltr" className="font-mono-num font-extrabold text-emerald-700 dark:text-emerald-400">
                  {formatSdg(Number(amountInput))} SDG
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={resetAndClose}
              className="w-full min-h-[48px] rounded-2xl cbos-gradient text-white text-sm font-extrabold cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
