import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ScanFace,
  WifiOff,
  X,
} from 'lucide-react';
import { SudaneseBank } from '../types/bank';
import {
  BIOMETRIC_TRANSFER_THRESHOLD,
  CBOS_BANK_CODE,
  SUDANESE_BANKS,
  formatIbanDisplay,
  formatSdg,
} from '../data/sudanBanks';

interface TransferModalProps {
  isOpen: boolean;
  availableBalance: number;
  remainingDailyLimit: number;
  isOffline: boolean;
  onClose: () => void;
  onExecuteTransfer: (payload: {
    bank: SudaneseBank;
    accountOrIban: string;
    recipientName: string;
    amount: number;
    fee: number;
    channel: 'IBAN';
    biometricVerified: boolean;
  }) => void;
}

type TransferStep = 'form' | 'liveness' | 'receipt';

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  availableBalance,
  remainingDailyLimit,
  isOffline,
  onClose,
  onExecuteTransfer,
}) => {
  const [selectedBankCode, setSelectedBankCode] = useState(SUDANESE_BANKS[0].code);
  const [accountNumber, setAccountNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [step, setStep] = useState<TransferStep>('form');
  const [error, setError] = useState<string | null>(null);
  const [verifyingFace, setVerifyingFace] = useState(false);

  if (!isOpen) return null;

  const selectedBank =
    SUDANESE_BANKS.find((b) => b.code === selectedBankCode) ?? SUDANESE_BANKS[0];

  const isSameBank = selectedBank.code === CBOS_BANK_CODE;
  const fee = isSameBank ? 0 : selectedBank.switchFee;
  const numericAmount = Number(amountInput.replace(/,/g, ''));
  const cleanedAlnum = accountNumber.replace(/\s+/g, '').toUpperCase();
  const requiresBiometric = numericAmount > BIOMETRIC_TRANSFER_THRESHOLD;

  const resetAndClose = () => {
    setStep('form');
    setError(null);
    setVerifyingFace(false);
    setAmountInput('');
    onClose();
  };

  const fillSampleRecipient = () => {
    if (isSameBank) {
      setAccountNumber('001833196044');
      setRecipientName('سارة الطيب عبد الله');
    } else {
      setAccountNumber(`SD04${selectedBank.code}0045882190`);
      setRecipientName('شركة النيل للتجارة والخدمات');
    }
    setAmountInput('250000');
    setError(null);
  };

  const displayAccount = isSameBank
    ? cleanedAlnum
    : formatIbanDisplay(cleanedAlnum);

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cleanedAlnum.length < 10) {
      setError(
        isSameBank
          ? 'يرجى إدخال رقم حساب المستفيد داخل بنك السودان المركزي (10 أرقام فأكثر).'
          : 'يرجى إدخال رقم الآيبان (IBAN) للمستفيد في البنك السوداني الآخر.'
      );
      return;
    }
    if (!recipientName.trim()) {
      setError('يرجى إدخال اسم المستفيد.');
      return;
    }
    if (!numericAmount || numericAmount <= 0) {
      setError('يرجى إدخال مبلغ تحويل صحيح بالجنيه السوداني.');
      return;
    }
    if (numericAmount + fee > availableBalance) {
      setError('الرصيد المتاح غير كافٍ لتغطية المبلغ والرسوم.');
      return;
    }
    if (numericAmount > remainingDailyLimit) {
      setError('المبلغ يتجاوز السقف اليومي المتبقي للتحويلات.');
      return;
    }

    if (requiresBiometric) {
      setStep('liveness');
      return;
    }

    onExecuteTransfer({
      bank: selectedBank,
      accountOrIban: displayAccount,
      recipientName: recipientName.trim(),
      amount: numericAmount,
      fee,
      channel: 'IBAN',
      biometricVerified: false,
    });
    setStep('receipt');
  };

  const handleConfirmBiometric = () => {
    setVerifyingFace(true);
    setTimeout(() => {
      setVerifyingFace(false);
      onExecuteTransfer({
        bank: selectedBank,
        accountOrIban: displayAccount,
        recipientName: recipientName.trim(),
        amount: numericAmount,
        fee,
        channel: 'IBAN',
        biometricVerified: true,
      });
      setStep('receipt');
    }, 1050);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#041E15]/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="تحويل مصرفي"
    >
      <div className="w-full max-w-lg bg-white dark:bg-[#0B1E17] border border-transparent dark:border-emerald-900/50 rounded-t-3xl sm:rounded-3xl p-6 max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="w-10 h-1.5 bg-slate-200 dark:bg-emerald-900 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-extrabold text-[#0F1F18] dark:text-emerald-50">
              تحويل مصرفي (CBOS / IBAN)
            </h2>
            <p className="text-xs text-slate-500 dark:text-emerald-200/70 mt-0.5">
              الرصيد المتاح:{' '}
              <span className="font-mono-num font-bold text-[#0F1F18] dark:text-emerald-100">
                {formatSdg(availableBalance)} ج.س
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            aria-label="إغلاق"
            className="min-h-[44px] min-w-[44px] rounded-full bg-slate-100 dark:bg-emerald-950 hover:bg-slate-200 dark:hover:bg-emerald-900 flex items-center justify-center text-slate-700 dark:text-emerald-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'form' && (
          <form onSubmit={handleSubmitForm} className="space-y-4">
            {isOffline && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3 flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-200">
                <WifiOff className="w-4 h-4 shrink-0" />
                <span>أنت غير متصل: سيتم حفظ التحويل وإرساله تلقائياً فور عودة الإنترنت.</span>
              </div>
            )}

            <div>
              <label
                htmlFor="target-bank"
                className="block text-xs font-bold text-slate-700 dark:text-emerald-100 mb-1.5"
              >
                اختر البنك المستلم في السودان
              </label>
              <select
                id="target-bank"
                value={selectedBankCode}
                onChange={(e) => setSelectedBankCode(e.target.value)}
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-slate-50/70 dark:bg-[#112A21] text-sm font-semibold text-[#0F1F18] dark:text-emerald-50"
              >
                {SUDANESE_BANKS.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.nameAr} ({bank.shortName})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 dark:text-emerald-200/70 mt-1">
                الرسوم: {fee === 0 ? 'مجاناً (0.00 ج.س)' : `${formatSdg(fee)} ج.س`} · الوقت المتوقع: {selectedBank.expectedTime}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="iban-number"
                  className="text-xs font-bold text-slate-700 dark:text-emerald-100"
                >
                  {isSameBank ? 'رقم حساب المستفيد (CBOS)' : 'رقم الآيبان (IBAN)'}
                </label>
                <button
                  type="button"
                  onClick={fillSampleRecipient}
                  className="text-[11px] font-bold text-[#064E3B] dark:text-[#D4AF37] hover:underline cursor-pointer"
                >
                  تعبئة بيانات تجريبية
                </button>
              </div>
              <input
                id="iban-number"
                type="text"
                dir="ltr"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={isSameBank ? '001833196044' : 'SD0400010045882190'}
                className="w-full min-h-[46px] px-4 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-slate-50/70 dark:bg-[#112A21] text-sm font-mono-num text-right text-[#0F1F18] dark:text-emerald-50"
              />
            </div>

            <div>
              <label
                htmlFor="recipient-name"
                className="block text-xs font-bold text-slate-700 dark:text-emerald-100 mb-1.5"
              >
                اسم المستفيد
              </label>
              <input
                id="recipient-name"
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="الاسم الكامل أو الجهة المستلمة"
                className="w-full min-h-[46px] px-4 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-slate-50/70 dark:bg-[#112A21] text-sm text-[#0F1F18] dark:text-emerald-50"
              />
            </div>

            <div>
              <label
                htmlFor="transfer-amount"
                className="block text-xs font-bold text-slate-700 dark:text-emerald-100 mb-1.5"
              >
                المبلغ (بالجنيه السوداني - SDG)
              </label>
              <input
                id="transfer-amount"
                type="number"
                min={1}
                step="any"
                dir="ltr"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="250000"
                className="w-full min-h-[48px] px-4 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-slate-50/70 dark:bg-[#112A21] text-base font-extrabold font-mono-num text-right text-[#0F1F18] dark:text-emerald-50"
              />
              {requiresBiometric && (
                <p className="text-[11px] font-bold text-[#064E3B] dark:text-[#D4AF37] mt-1.5 flex items-center gap-1.5">
                  <ScanFace className="w-3.5 h-3.5" />
                  <span>
                    يتجاوز المبلغ {formatSdg(BIOMETRIC_TRANSFER_THRESHOLD)} ج.س — يلزم التحقق بالوجه قبل التنفيذ.
                  </span>
                </p>
              )}
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
              <ArrowUpRight className="w-4 h-4 text-[#D4AF37]" />
              <span>{requiresBiometric ? 'المتابعة للتحقق ببصمة الوجه' : 'تحويل'}</span>
            </button>
          </form>
        )}

        {step === 'liveness' && (
          <div className="space-y-5 text-center">
            <div className="rounded-2xl bg-[#04281B] text-white p-6">
              <div className="w-36 h-44 mx-auto rounded-[50%_50%_46%_46%] border-2 border-[#D4AF37] flex items-center justify-center relative overflow-hidden bg-[#064E3B]/70">
                <ScanFace className="w-16 h-16 text-[#D4AF37]" />
                {verifyingFace && (
                  <div className="absolute inset-x-2 top-2 h-0.5 bg-[#D4AF37] shadow-[0_0_12px_#D4AF37] animate-scan-sweep" />
                )}
              </div>
              <h3 className="text-base font-extrabold mt-4">
                التحقق الحي للتحويلات الكبيرة
              </h3>
              <p className="text-xs text-emerald-100 mt-1">
                تأكيد تحويل{' '}
                <span className="font-mono-num font-bold text-white">
                  {formatSdg(numericAmount)} ج.س
                </span>{' '}
                إلى {selectedBank.nameAr}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="min-h-[48px] rounded-2xl border border-slate-200 dark:border-emerald-900 text-sm font-bold text-slate-700 dark:text-emerald-100 cursor-pointer"
              >
                تعديل
              </button>
              <button
                type="button"
                disabled={verifyingFace}
                onClick={handleConfirmBiometric}
                className="min-h-[48px] rounded-2xl cbos-gradient text-white text-sm font-extrabold disabled:opacity-70 cursor-pointer"
              >
                {verifyingFace ? 'جارٍ مطابقة الوجه...' : 'تأكيد بالبصمة الحية'}
              </button>
            </div>
          </div>
        )}

        {step === 'receipt' && (
          <div className="space-y-5 text-center py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#0F1F18] dark:text-emerald-50">
                {isOffline
                  ? 'تم حفظ التحويل للمزامنة التلقائية'
                  : 'تمت المقاصة والتحويل بنجاح'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-emerald-200/70 mt-1">
                {isOffline
                  ? 'سيُنفذ التحويل فور عودة الاتصال بالإنترنت'
                  : 'تم إرسال إشعار SMS وبريد إلكتروني بتفاصيل التحويل'}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-[#112A21] rounded-2xl border border-slate-200 dark:border-emerald-900/50 p-4 divide-y divide-slate-200/70 dark:divide-emerald-900/50 text-right">
              <div className="py-2 flex justify-between text-xs">
                <span className="text-slate-500 dark:text-emerald-200/70">البنك المستلم</span>
                <span className="font-bold text-[#0F1F18] dark:text-emerald-50">
                  {selectedBank.nameAr}
                </span>
              </div>
              <div className="py-2 flex justify-between text-xs">
                <span className="text-slate-500 dark:text-emerald-200/70">المستفيد</span>
                <span className="font-bold text-[#0F1F18] dark:text-emerald-50">
                  {recipientName}
                </span>
              </div>
              <div className="py-2 flex justify-between text-xs">
                <span className="text-slate-500 dark:text-emerald-200/70">الحساب / IBAN</span>
                <span dir="ltr" className="font-mono-num font-bold text-[#0F1F18] dark:text-emerald-50">
                  {displayAccount}
                </span>
              </div>
              <div className="py-2 flex justify-between text-xs">
                <span className="text-slate-500 dark:text-emerald-200/70">المبلغ المحوّل</span>
                <span dir="ltr" className="font-mono-num font-extrabold text-emerald-700 dark:text-emerald-400">
                  {formatSdg(numericAmount)} SDG
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={resetAndClose}
              className="w-full min-h-[48px] rounded-2xl cbos-gradient text-white text-sm font-extrabold cursor-pointer"
            >
              العودة إلى الرئيسية
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
