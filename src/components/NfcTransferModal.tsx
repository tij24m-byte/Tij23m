import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Nfc,
  ScanFace,
  Smartphone,
  WifiOff,
  X,
} from 'lucide-react';
import { BankUserProfile, SudaneseBank } from '../types/bank';
import {
  CBOS_BANK_CODE,
  SUDANESE_BANKS,
  formatSdg,
} from '../data/sudanBanks';

interface NfcTransferModalProps {
  isOpen: boolean;
  user: BankUserProfile;
  isOffline: boolean;
  onClose: () => void;
  onExecuteTransfer: (payload: {
    bank: SudaneseBank;
    accountOrIban: string;
    recipientName: string;
    amount: number;
    fee: number;
    channel: 'NFC';
    biometricVerified: boolean;
  }) => void;
}

interface NfcReceiverInfo {
  name: string;
  bankCode: string;
  accountNumber: string;
  iban: string;
  receiverHasInternet: boolean;
}

const PRESET_NFC_DEVICES: NfcReceiverInfo[] = [
  {
    name: 'محمد الطيب عبد الرحمن (بدون إنترنت)',
    bankCode: '0000',
    accountNumber: '001877120934',
    iban: 'SD94 0000 0018 7712 0934',
    receiverHasInternet: false,
  },
  {
    name: 'مؤسسة أم درمان التجارية',
    bankCode: '0003',
    accountNumber: '1184550901',
    iban: 'SD04 0003 1184 5509 0122',
    receiverHasInternet: true,
  },
];

export const NfcTransferModal: React.FC<NfcTransferModalProps> = ({
  isOpen,
  user,
  isOffline,
  onClose,
  onExecuteTransfer,
}) => {
  const [stage, setStage] = useState<'proximity' | 'amount' | 'face' | 'done'>('proximity');
  const [receiver, setReceiver] = useState<NfcReceiverInfo | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [touching, setTouching] = useState(false);
  const [verifyingFace, setVerifyingFace] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nfcHardwareMsg, setNfcHardwareMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setStage('proximity');
    setReceiver(null);
    setAmountInput('');
    setTouching(false);
    setVerifyingFace(false);
    setError(null);
    setNfcHardwareMsg(null);
    onClose();
  };

  const handleTouchPhones = async (preset: NfcReceiverInfo) => {
    setError(null);
    setTouching(true);

    // Attempt Web NFC API if browser supports it, while smoothly falling back to two-phone NFC exchange
    try {
      const win = window as unknown as {
        NDEFReader?: new () => { scan: () => Promise<void> };
      };
      if (win.NDEFReader) {
        const reader = new win.NDEFReader();
        await reader.scan().catch(() => undefined);
      }
    } catch {
      setNfcHardwareMsg('تمت محاكاة اقتران NFC بين الهاتفين تلقائياً.');
    }

    setTimeout(() => {
      setTouching(false);
      setReceiver(preset);
      setStage('amount');
    }, 1150);
  };

  const targetBank =
    SUDANESE_BANKS.find((b) => b.code === receiver?.bankCode) ?? SUDANESE_BANKS[0];
  const isSameBank = receiver?.bankCode === CBOS_BANK_CODE;
  const fee = isSameBank ? 0 : targetBank.switchFee;
  const numericAmount = Number(amountInput);

  const handleProceedFace = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!numericAmount || numericAmount <= 0) {
      setError('يرجى إدخال مبلغ صحيح بالجنيه السوداني.');
      return;
    }
    if (numericAmount + fee > user.digitalBalance) {
      setError('الرصيد المتاح غير كافٍ لإتمام العملية.');
      return;
    }
    setStage('face');
  };

  const handleConfirmFace = () => {
    if (!receiver) return;
    setVerifyingFace(true);
    setTimeout(() => {
      setVerifyingFace(false);
      onExecuteTransfer({
        bank: targetBank,
        accountOrIban: isSameBank ? receiver.accountNumber : receiver.iban,
        recipientName: receiver.name,
        amount: numericAmount,
        fee,
        channel: 'NFC',
        biometricVerified: true,
      });
      setStage('done');
    }, 1050);
  };

  const willQueueOffline = isOffline || receiver?.receiverHasInternet === false;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#041E15]/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="تحويل عبر NFC - لمس الهواتف"
    >
      <div className="w-full max-w-lg bg-white dark:bg-[#0B1E17] border border-transparent dark:border-emerald-900/50 rounded-t-3xl sm:rounded-3xl p-6 max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="w-10 h-1.5 bg-slate-200 dark:bg-emerald-900 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl cbos-gradient text-white flex items-center justify-center shrink-0">
              <Nfc className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#0F1F18] dark:text-emerald-50">
                تحويل عبر NFC - لمس الهواتف
              </h2>
              <p className="text-xs text-slate-500 dark:text-emerald-200/70">
                تبادل فوري لبيانات الحساب باللمس حتى في حال انقطاع الإنترنت لدى المستلم
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

        {stage === 'proximity' && (
          <div className="space-y-5">
            <div className="rounded-3xl bg-[#04281B] text-white p-6 text-center relative overflow-hidden">
              <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-[#D4AF37]/50 animate-nfc-ripple" />
                <div className="absolute inset-3 rounded-full border-2 border-emerald-400/50 animate-nfc-ripple" />
                <div className="w-20 h-20 rounded-2xl bg-[#064E3B] border border-[#D4AF37] flex items-center justify-center relative z-10 gap-1">
                  <Smartphone className="w-6 h-6 text-[#D4AF37]" />
                  <Nfc className="w-5 h-5 text-emerald-300" />
                </div>
              </div>

              <h3 className="text-base font-extrabold mt-4 text-[#D4AF37]">
                قرّب هاتفك من هاتف المستلم
              </h3>
              <p className="text-xs text-emerald-100/85 mt-1">
                {touching
                  ? 'جارٍ استلام بيانات الحساب عبر شريحة NFC...'
                  : 'اختر هاتف مستلم قريب لبدء الاقتران التلقائي ونقل رقم الحساب وIBAN'}
              </p>
              {nfcHardwareMsg && (
                <p className="text-[11px] text-emerald-300 mt-1">{nfcHardwareMsg}</p>
              )}
            </div>

            <div className="space-y-2.5">
              {PRESET_NFC_DEVICES.map((device) => (
                <button
                  key={device.accountNumber}
                  type="button"
                  disabled={touching}
                  onClick={() => handleTouchPhones(device)}
                  className="w-full text-right p-4 rounded-2xl border border-slate-200 dark:border-emerald-900/50 bg-slate-50/70 dark:bg-[#112A21] hover:border-[#064E3B] dark:hover:border-[#D4AF37] flex items-center justify-between gap-3 cursor-pointer disabled:opacity-60"
                >
                  <div>
                    <div className="text-sm font-bold text-[#0F1F18] dark:text-emerald-50">
                      {device.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-emerald-200/70 mt-0.5">
                      {device.bankCode === CBOS_BANK_CODE
                        ? 'CBOS (فوري)'
                        : 'بنك أم درمان الوطني (IBAN)'}
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[#064E3B] dark:text-[#D4AF37] whitespace-nowrap">
                    لمس الهاتفين
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {stage === 'amount' && receiver && (
          <form onSubmit={handleProceedFace} className="space-y-4">
            <div className="rounded-2xl bg-slate-50 dark:bg-[#112A21] border border-slate-200 dark:border-emerald-900/50 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-emerald-200/70">المستلم المقترن عبر NFC</span>
                <span className="font-extrabold text-[#0F1F18] dark:text-emerald-50">
                  {receiver.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-emerald-200/70">المصرف</span>
                <span className="font-bold text-[#064E3B] dark:text-[#D4AF37]">
                  {targetBank.nameAr}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-emerald-200/70">
                  {isSameBank ? 'رقم الحساب' : 'رقم IBAN'}
                </span>
                <span dir="ltr" className="font-mono-num font-bold text-[#0F1F18] dark:text-emerald-50">
                  {isSameBank ? receiver.accountNumber : receiver.iban}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-emerald-200/70">الرسوم</span>
                <span className="font-bold text-[#0F1F18] dark:text-emerald-50">
                  {fee === 0 ? 'مجاني (0.00 ج.س)' : `${formatSdg(fee)} ج.س (المقاصة القومية)`}
                </span>
              </div>
            </div>

            {willQueueOffline && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-3 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200 font-semibold">
                <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {isOffline
                    ? 'أنت غير متصل بالإنترنت حالياً: سيتم حفظ أمر التحويل وإرساله تلقائياً فور عودة الإنترنت.'
                    : 'هاتف المستلم غير متصل بالإنترنت حالياً: سيتم تقييد التحويل وإشعار المستلم فور عودة اتصاله.'}
                </span>
              </div>
            )}

            <div>
              <label
                htmlFor="nfc-amount"
                className="block text-xs font-bold text-slate-700 dark:text-emerald-100 mb-1.5"
              >
                المبلغ (ج.س)
              </label>
              <input
                id="nfc-amount"
                type="number"
                min={1}
                dir="ltr"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="40000"
                className="w-full min-h-[48px] px-4 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-slate-50 dark:bg-[#112A21] text-base font-extrabold font-mono-num text-right text-[#0F1F18] dark:text-emerald-50 focus:outline-none"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-3 flex items-center gap-2 text-xs text-red-700 dark:text-red-300 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full min-h-[50px] rounded-2xl cbos-gradient text-white text-sm font-extrabold cursor-pointer"
            >
              تأكيد ببصمة الوجه
            </button>
          </form>
        )}

        {stage === 'face' && receiver && (
          <div className="space-y-5 text-center">
            <div className="rounded-2xl bg-[#04281B] text-white p-6">
              <div className="w-32 h-40 mx-auto rounded-[50%_50%_46%_46%] border-2 border-[#D4AF37] flex items-center justify-center relative overflow-hidden bg-[#064E3B]/60">
                <ScanFace className="w-14 h-14 text-[#D4AF37]" />
                {verifyingFace && (
                  <div className="absolute inset-x-2 top-2 h-0.5 bg-[#D4AF37] shadow-[0_0_12px_#D4AF37] animate-scan-sweep" />
                )}
              </div>
              <h3 className="text-base font-extrabold mt-4">
                المصادقة بالوجه لتحويل NFC
              </h3>
              <p className="text-xs text-emerald-100 mt-1">
                تحويل {formatSdg(numericAmount)} ج.س إلى {receiver.name}
              </p>
            </div>

            <button
              type="button"
              disabled={verifyingFace}
              onClick={handleConfirmFace}
              className="w-full min-h-[50px] rounded-2xl cbos-gradient text-white text-sm font-extrabold disabled:opacity-70 cursor-pointer"
            >
              {verifyingFace ? 'جارٍ تنفيذ التحويل...' : 'تأكيد وإتمام النقل باللمس'}
            </button>
          </div>
        )}

        {stage === 'done' && receiver && (
          <div className="space-y-4 text-center py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-lg font-extrabold text-[#0F1F18] dark:text-emerald-50">
              {isOffline
                ? 'تم حفظ التحويل للمزامنة التلقائية'
                : 'تم التحويل عبر NFC بنجاح'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-emerald-200/70">
              {isOffline
                ? 'سيُرسل التحويل تلقائياً بمجرد عودة الإنترنت'
                : isSameBank
                ? 'تحويل فوري بدون رسوم بين حسابات بنك السودان المركزي'
                : 'تم التوجيه عبر المقاصة القومية بالآيبان'}
            </p>
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
