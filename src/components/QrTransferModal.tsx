import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  QrCode,
  ScanFace,
  ShieldCheck,
  X,
} from 'lucide-react';
import { BankUserProfile, QrPayloadData, SudaneseBank } from '../types/bank';
import {
  CBOS_BANK_CODE,
  CBOS_BANK_NAME,
  SUDANESE_BANKS,
  formatSdg,
} from '../data/sudanBanks';

interface QrTransferModalProps {
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
    channel: 'QR';
    biometricVerified: boolean;
  }) => void;
}

const SAMPLE_QR_TARGETS: QrPayloadData[] = [
  {
    type: 'CBOS_PAY',
    name: 'سارة الطيب عبد الله حسن',
    accountNumber: '001833196044',
    iban: 'SD94 0000 0018 3319 6044',
    bankCode: '0000',
    bankName: 'بنك السودان المركزي - CBOS',
  },
  {
    type: 'CBOS_PAY',
    name: 'شركة النيل للتجارة المحدودة',
    accountNumber: '0045882190',
    iban: 'SD04 0001 0045 8821 9012',
    bankCode: '0001',
    bankName: 'بنك الخرطوم',
  },
  {
    type: 'CBOS_PAY',
    name: 'متجر الخرطوم المركزي',
    accountNumber: '9910341200',
    iban: 'SD04 0002 9910 3412 4400',
    bankCode: '0002',
    bankName: 'بنك فيصل الإسلامي السوداني',
  },
];

export const QrTransferModal: React.FC<QrTransferModalProps> = ({
  isOpen,
  user,
  isOffline,
  onClose,
  onExecuteTransfer,
}) => {
  const [tab, setTab] = useState<'scan' | 'my_qr'>('scan');
  const [scannedTarget, setScannedTarget] = useState<QrPayloadData | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [stage, setStage] = useState<'pick' | 'amount' | 'face' | 'done'>('pick');
  const [cameraActive, setCameraActive] = useState(false);
  const [verifyingFace, setVerifyingFace] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualQrText, setManualQrText] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  if (!isOpen) return null;

  const myQrPayload: QrPayloadData = {
    type: 'CBOS_PAY',
    name: user.fullName,
    accountNumber: user.accountNumber,
    iban: user.iban,
    bankCode: CBOS_BANK_CODE,
    bankName: CBOS_BANK_NAME,
  };

  const resetAndClose = () => {
    stopCamera();
    setStage('pick');
    setScannedTarget(null);
    setAmountInput('');
    setError(null);
    setVerifyingFace(false);
    onClose();
  };

  const startScannerCamera = async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('الكاميرا غير متاحة؛ يمكنك مسح رمز مستلم جاهز أو لصق بيانات QR.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 50);
    } catch {
      setError('تعذّر تشغيل الكاميرا؛ استخدم المسح السريع لرموز QR أدناه.');
    }
  };

  const handleSelectScannedQr = (target: QrPayloadData) => {
    stopCamera();
    setScannedTarget(target);
    setStage('amount');
    setError(null);
  };

  const handleParseManualQr = () => {
    setError(null);
    try {
      const parsed = JSON.parse(manualQrText) as QrPayloadData;
      if (!parsed.accountNumber || !parsed.bankCode || !parsed.name) {
        setError('بيانات رمز QR غير مكتملة.');
        return;
      }
      handleSelectScannedQr(parsed);
    } catch {
      setError('صيغة رمز QR غير صالحة؛ يرجى اختيار أحد الرموز التجريبية أو لصق JSON صالح.');
    }
  };

  const targetBank: SudaneseBank =
    SUDANESE_BANKS.find((b) => b.code === scannedTarget?.bankCode) ?? SUDANESE_BANKS[1];

  const isSameBank = scannedTarget?.bankCode === CBOS_BANK_CODE;
  const fee = isSameBank ? 0 : targetBank.switchFee;
  const numericAmount = Number(amountInput);

  const handleProceedToFace = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!numericAmount || numericAmount <= 0) {
      setError('يرجى إدخال مبلغ صحيح بالجنيه السوداني.');
      return;
    }
    if (numericAmount + fee > user.digitalBalance) {
      setError('الرصيد المتاح غير كافٍ لتغطية المبلغ والرسوم.');
      return;
    }
    setStage('face');
  };

  const handleConfirmWithFace = () => {
    if (!scannedTarget) return;
    setVerifyingFace(true);
    const delay = isSameBank ? 950 : 1200;
    setTimeout(() => {
      setVerifyingFace(false);
      onExecuteTransfer({
        bank: targetBank,
        accountOrIban: isSameBank ? scannedTarget.accountNumber : scannedTarget.iban,
        recipientName: scannedTarget.name,
        amount: numericAmount,
        fee,
        channel: 'QR',
        biometricVerified: true,
      });
      setStage('done');
    }, delay);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#041E15]/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="تحويل عبر QR"
    >
      <div className="w-full max-w-lg bg-white dark:bg-[#0B1E17] border border-transparent dark:border-emerald-900/50 rounded-t-3xl sm:rounded-3xl p-6 max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="w-10 h-1.5 bg-slate-200 dark:bg-emerald-900 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl cbos-gradient text-white flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#0F1F18] dark:text-emerald-50">
                تحويل عبر QR
              </h2>
              <p className="text-xs text-slate-500 dark:text-emerald-200/70">
                امسح رمز المستلم أو اعرض رمزك الشخصي للاستلام الفوري
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

        {/* Mode Switch */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-[#112A21] rounded-xl mb-5">
          <button
            type="button"
            onClick={() => setTab('scan')}
            className={`min-h-[40px] rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              tab === 'scan'
                ? 'bg-[#064E3B] text-white'
                : 'text-slate-600 dark:text-emerald-200/70'
            }`}
          >
            مسح QR للتحويل
          </button>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setTab('my_qr');
            }}
            className={`min-h-[40px] rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              tab === 'my_qr'
                ? 'bg-[#064E3B] text-white'
                : 'text-slate-600 dark:text-emerald-200/70'
            }`}
          >
            رمز QR الخاص بي
          </button>
        </div>

        {tab === 'my_qr' ? (
          <div className="text-center space-y-4 py-2">
            <div className="inline-block p-5 bg-white rounded-3xl border-2 border-[#D4AF37] shadow-md">
              <QRCodeSVG
                value={JSON.stringify(myQrPayload)}
                size={196}
                fgColor="#064E3B"
                bgColor="#FFFFFF"
                level="M"
              />
            </div>

            <div className="bg-slate-50 dark:bg-[#112A21] rounded-2xl border border-slate-200 dark:border-emerald-900/50 p-4 text-right space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-emerald-200/70">الاسم</span>
                <span className="font-bold text-[#0F1F18] dark:text-emerald-50">
                  {user.fullName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-emerald-200/70">المصرف</span>
                <span className="font-bold text-[#064E3B] dark:text-[#D4AF37]">
                  {CBOS_BANK_NAME}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-emerald-200/70">رقم الحساب</span>
                <span dir="ltr" className="font-mono-num font-bold text-[#0F1F18] dark:text-emerald-50">
                  {user.accountNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-emerald-200/70">رقم IBAN</span>
                <span dir="ltr" className="font-mono-num font-bold text-[#0F1F18] dark:text-emerald-50">
                  {user.iban}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {stage === 'pick' && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#04281B] text-white p-4 text-center space-y-3">
                  {cameraActive ? (
                    <div className="relative rounded-xl overflow-hidden h-44 bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-6 border-2 border-[#D4AF37] rounded-xl pointer-events-none" />
                    </div>
                  ) : (
                    <div className="py-4 space-y-2">
                      <Camera className="w-8 h-8 text-[#D4AF37] mx-auto" />
                      <p className="text-xs text-emerald-100">
                        وجّه الكاميرا لمسح رمز QR الخاص بالمستلم أو اختر مستلماً فورياً أدناه
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={cameraActive ? stopCamera : startScannerCamera}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#D4AF37] text-[#04281B] text-xs font-extrabold cursor-pointer"
                  >
                    {cameraActive ? 'إيقاف الكاميرا' : 'تشغيل كاميرا المسح'}
                  </button>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-700 dark:text-emerald-100 mb-2">
                    محاكاة مسح رمز QR (حسابات سودانية حقيقية):
                  </div>
                  <div className="space-y-2">
                    {SAMPLE_QR_TARGETS.map((target) => {
                      const isCbos = target.bankCode === CBOS_BANK_CODE;
                      return (
                        <button
                          key={target.accountNumber}
                          type="button"
                          onClick={() => handleSelectScannedQr(target)}
                          className="w-full text-right p-3.5 rounded-2xl border border-slate-200 dark:border-emerald-900/50 bg-slate-50/70 dark:bg-[#112A21] hover:border-[#064E3B] dark:hover:border-[#D4AF37] transition-colors flex items-center justify-between gap-3 cursor-pointer"
                        >
                          <div>
                            <div className="text-sm font-bold text-[#0F1F18] dark:text-emerald-50">
                              {target.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-emerald-200/70 mt-0.5">
                              {target.bankName} ·{' '}
                              <span dir="ltr" className="font-mono-num">
                                {target.accountNumber}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`text-[11px] font-extrabold whitespace-nowrap ${
                              isCbos
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-[#B48A1E] dark:text-[#D4AF37]'
                            }`}
                          >
                            {isCbos ? 'فوري بدون رسوم' : 'عبر المقاصة القومية'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-emerald-900/40 space-y-2">
                  <label
                    htmlFor="manual-qr"
                    className="block text-[11px] font-bold text-slate-500 dark:text-emerald-200/70"
                  >
                    أو الصق محتوى رمز QR (JSON):
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="manual-qr"
                      type="text"
                      dir="ltr"
                      value={manualQrText}
                      onChange={(e) => setManualQrText(e.target.value)}
                      placeholder='{"name":"...","accountNumber":"...","bankCode":"0000"}'
                      className="flex-1 min-h-[42px] px-3 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-slate-50 dark:bg-[#112A21] text-xs font-mono-num text-[#0F1F18] dark:text-emerald-50"
                    />
                    <button
                      type="button"
                      onClick={handleParseManualQr}
                      className="min-h-[42px] px-4 rounded-xl bg-[#064E3B] text-white text-xs font-bold cursor-pointer"
                    >
                      قراءة
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-600 dark:text-red-300 font-semibold">
                    {error}
                  </p>
                )}
              </div>
            )}

            {stage === 'amount' && scannedTarget && (
              <form onSubmit={handleProceedToFace} className="space-y-4">
                <div className="rounded-2xl bg-slate-50 dark:bg-[#112A21] border border-slate-200 dark:border-emerald-900/50 p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-emerald-200/70">اسم المستلم</span>
                    <span className="font-extrabold text-[#0F1F18] dark:text-emerald-50">
                      {scannedTarget.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-emerald-200/70">المصرف المستلم</span>
                    <span className="font-bold text-[#064E3B] dark:text-[#D4AF37]">
                      {targetBank.nameAr}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-emerald-200/70">
                      {isSameBank ? 'رقم الحساب' : 'رقم IBAN'}
                    </span>
                    <span dir="ltr" className="font-mono-num font-bold text-[#0F1F18] dark:text-emerald-50">
                      {isSameBank ? scannedTarget.accountNumber : scannedTarget.iban}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-emerald-900/50">
                    <span className="text-slate-500 dark:text-emerald-200/70">مسار التحويل</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      {isSameBank
                        ? 'تحويل داخلي فوري (CBOS إلى CBOS)'
                        : 'عبر المقاصة القومية (محوّل البنك المركزي)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-emerald-200/70">الرسوم والوقت المتوقع</span>
                    <span className="font-bold text-[#0F1F18] dark:text-emerald-50">
                      {fee === 0 ? 'بدون رسوم' : `${formatSdg(fee)} ج.س`} ·{' '}
                      {targetBank.expectedTime}
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="qr-amount"
                    className="block text-xs font-bold text-slate-700 dark:text-emerald-100 mb-1.5"
                  >
                    المبلغ المراد تحويله (ج.س)
                  </label>
                  <input
                    id="qr-amount"
                    type="number"
                    min={1}
                    dir="ltr"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="50000"
                    className="w-full min-h-[48px] px-4 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-slate-50 dark:bg-[#112A21] text-base font-extrabold font-mono-num text-right text-[#0F1F18] dark:text-emerald-50 focus:outline-none focus:border-[#064E3B]"
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-3 flex items-center gap-2 text-xs text-red-700 dark:text-red-300 font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStage('pick')}
                    className="min-h-[48px] rounded-2xl border border-slate-200 dark:border-emerald-900 text-sm font-bold text-slate-700 dark:text-emerald-100 cursor-pointer"
                  >
                    تغيير المستلم
                  </button>
                  <button
                    type="submit"
                    className="min-h-[48px] rounded-2xl cbos-gradient text-white text-sm font-extrabold cursor-pointer"
                  >
                    متابعة للتأكيد بالوجه
                  </button>
                </div>
              </form>
            )}

            {stage === 'face' && scannedTarget && (
              <div className="space-y-5 text-center">
                <div className="rounded-2xl bg-[#04281B] text-white p-6">
                  <div className="w-32 h-40 mx-auto rounded-[50%_50%_46%_46%] border-2 border-[#D4AF37] flex items-center justify-center relative overflow-hidden bg-[#064E3B]/60">
                    <ScanFace className="w-14 h-14 text-[#D4AF37]" />
                    {verifyingFace && (
                      <div className="absolute inset-x-2 top-2 h-0.5 bg-[#D4AF37] shadow-[0_0_12px_#D4AF37] animate-scan-sweep" />
                    )}
                  </div>
                  <h3 className="text-base font-extrabold mt-4">
                    تأكيد التحويل عبر QR ببصمة الوجه
                  </h3>
                  <p className="text-xs text-emerald-100 mt-1">
                    إرسال{' '}
                    <span className="font-mono-num font-bold text-white">
                      {formatSdg(numericAmount)} ج.س
                    </span>{' '}
                    إلى {scannedTarget.name}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={verifyingFace}
                  onClick={handleConfirmWithFace}
                  className="w-full min-h-[50px] rounded-2xl cbos-gradient text-white text-sm font-extrabold disabled:opacity-70 cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>
                    {verifyingFace
                      ? 'جارٍ مطابقة بصمة الوجه وتنفيذ التحويل...'
                      : 'تأكيد وإرسال التحويل'}
                  </span>
                </button>
              </div>
            )}

            {stage === 'done' && scannedTarget && (
              <div className="space-y-4 text-center py-2">
                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="text-lg font-extrabold text-[#0F1F18] dark:text-emerald-50">
                  {isOffline
                    ? 'تم حفظ التحويل في قائمة انتظار عدم الاتصال'
                    : isSameBank
                    ? 'تم التحويل الفوري خلال ثانية واحدة'
                    : 'تم إرسال التحويل عبر المقاصة القومية'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-emerald-200/70">
                  {isOffline
                    ? 'سيُنفذ التحويل تلقائياً فور عودة الاتصال بالإنترنت'
                    : `تم إرسال إشعار SMS وبريد إلكتروني بتفاصيل العملية إلى ${user.phone}`}
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
          </>
        )}
      </div>
    </div>
  );
};
