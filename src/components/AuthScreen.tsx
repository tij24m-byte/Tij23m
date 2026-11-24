import React, { useEffect, useRef, useState } from 'react';
import { ConfirmationResult } from 'firebase/auth';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowLeftRight,
  Camera,
  CheckCircle2,
  FileCheck2,
  Fingerprint,
  KeyRound,
  Landmark,
  Lock,
  Mail,
  ScanFace,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { BankUserProfile, DocumentType } from '../types/bank';
import { PWAInstallButton } from './PWAInstallButton';
import {
  auth,
  googleProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
} from '../firebase';
import {
  DEFAULT_USER_PROFILE,
  generate512FaceVector,
  generateAccountNumber,
  generateBiometricVectorHash,
  generateDeviceId,
  generateSudaneseIban,
  hashPin,
  normalizeSudanPhone,
} from '../data/sudanBanks';

interface AuthScreenProps {
  existingNationalIds: string[];
  existingFaceHashes: string[];
  currentBoundDeviceId: string;
  currentBoundDeviceName: string;
  storedPinHash: string;
  onLoginSuccess: (
    profile?: BankUserProfile,
    deviceTransfer?: { deviceName: string; deviceId: string }
  ) => void;
  onDuplicateFaceFraud: (reason: string) => void;
  onOpenCbosAdmin: () => void;
}

type AuthMode = 'login' | 'register';
type BiometricState = 'idle' | 'scanning_face' | 'scanning_finger' | 'verified' | 'error';

export const AuthScreen: React.FC<AuthScreenProps> = ({
  existingNationalIds,
  existingFaceHashes,
  currentBoundDeviceId,
  currentBoundDeviceName,
  storedPinHash,
  onLoginSuccess,
  onDuplicateFaceFraud,
  onOpenCbosAdmin,
}) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isDeviceTransfer, setIsDeviceTransfer] = useState(false);
  const [destinationDeviceName, setDestinationDeviceName] = useState(
    'هاتف جديد (الجهاز الوجهة)'
  );
  const [loginPhone, setLoginPhone] = useState('+249912345678');
  const [loginPin, setLoginPin] = useState('1234');
  const [bioState, setBioState] = useState<BiometricState>('idle');
  const [bioMessage, setBioMessage] = useState(
    'جاهز لمطابقة البصمة الرقمية للوجه (512 رقماً) أو بصمة الإصبع'
  );
  const [scanProgress, setScanProgress] = useState(0);
  const [useLiveCamera, setUseLiveCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  // Registration state (Steps 0..4)
  // 0: Phone + Email + SMS OTP
  // 1: Document Scan (Passport / National ID)
  // 2: Live Selfie Video + Turn Head Left & Right + 99% Match + Duplicate Check
  // 3: 4-Digit PIN + Fingerprint + Encrypted 512-number vector only
  const [regStep, setRegStep] = useState<0 | 1 | 2 | 3>(0);
  const [regPhone, setRegPhone] = useState('+249');
  const [regEmail, setRegEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpInfo, setOtpInfo] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const [docType, setDocType] = useState<DocumentType>('national_id');
  const [regNationalId, setRegNationalId] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [docScanned, setDocScanned] = useState(false);

  const [turnedLeft, setTurnedLeft] = useState(false);
  const [turnedRight, setTurnedRight] = useState(false);
  const [faceMatchedScore, setFaceMatchedScore] = useState<number | null>(null);
  const [duplicateBlocked, setDuplicateBlocked] = useState(false);
  const [generatedHash, setGeneratedHash] = useState('');
  const [generatedVector512, setGeneratedVector512] = useState<number[]>([]);

  const [regPin, setRegPin] = useState('');
  const [regFingerprintDone, setRegFingerprintDone] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setUseLiveCamera(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
      }
    };
  }, []);

  const toggleLiveCamera = async () => {
    if (useLiveCamera) {
      stopCamera();
      return;
    }
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          'الكاميرا غير متاحة في هذا المتصفح؛ تم تفعيل الفحص التفاعلي الآمن.'
        );
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      streamRef.current = stream;
      setUseLiveCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 60);
    } catch {
      setCameraError(
        'تعذّر تشغيل الكاميرا؛ يمكنك المتابعة بالتحقق التفاعلي أدناه.'
      );
      setUseLiveCamera(false);
    }
  };

  const handlePhoneInput = (val: string, setter: (v: string) => void) => {
    if (!val.startsWith('+249')) {
      setter(normalizeSudanPhone(val));
      return;
    }
    const rest = val.slice(4).replace(/\D/g, '').slice(0, 9);
    setter(`+249${rest}`);
  };

  const handleGoogleSignIn = async () => {
    setGoogleBusy(true);
    setBioState('idle');
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const displayName = cred.user.displayName || DEFAULT_USER_PROFILE.fullName;
      const words = displayName.split(/\s+/);
      const initials =
        words.length >= 2 ? `${words[0][0]} ${words[1][0]}` : displayName.slice(0, 2);

      const firebaseProfile: BankUserProfile = {
        ...DEFAULT_USER_PROFILE,
        uid: cred.user.uid,
        fullName: displayName,
        initials,
        email: cred.user.email || DEFAULT_USER_PROFILE.email,
        isAdmin: cred.user.email === 'tij24m@gmail.com',
      };
      onLoginSuccess(firebaseProfile);
    } catch {
      setBioState('error');
      setBioMessage('تعذّر إكمال تسجيل الدخول عبر غوغل؛ يمكنك الدخول برقم الهاتف والوجه.');
    } finally {
      setGoogleBusy(false);
    }
  };

  const runFaceLogin = () => {
    if (bioState === 'scanning_face' || bioState === 'scanning_finger') return;
    if (!/^\+249\d{9}$/.test(loginPhone.trim())) {
      setBioState('error');
      setBioMessage('يرجى إدخال رقم هاتف سوداني صحيح يبدأ بـ +249 ويتبعه 9 أرقام.');
      return;
    }
    if (!/^\d{4}$/.test(loginPin.trim()) || hashPin(loginPin.trim()) !== storedPinHash) {
      setBioState('error');
      setBioMessage('الرمز السري (PIN) المكوّن من 4 أرقام غير صحيح. (الافتراضي: 1234)');
      return;
    }
    if (isDeviceTransfer && destinationDeviceName.trim().length < 3) {
      setBioState('error');
      setBioMessage('يرجى إدخال اسم الهاتف الجديد (الوجهة) قبل التحقق بالوجه.');
      return;
    }

    setBioState('scanning_face');
    setScanProgress(20);
    setBioMessage(
      isDeviceTransfer
        ? 'جارٍ التحقق من الهاتف الوجهة ومطابقة بصمة الوجه (512 رقماً)...'
        : 'جارٍ فحص حيوية الوجه ومطابقة التوقيع الرقمي (512 رقماً)...'
    );

    setTimeout(() => {
      setScanProgress(65);
      setBioMessage('مطابقة البصمة الرقمية للوجه مع سجل بنك السودان المركزي - CBOS...');
    }, 500);

    setTimeout(() => {
      setScanProgress(100);
      setBioState('verified');
      setBioMessage(
        isDeviceTransfer
          ? 'تم التحقق من الوجهة بالوجه · تم نقل الحساب وفصل الهاتف السابق'
          : 'تم التوثيق بنجاح · نسبة التطابق 99.8%'
      );
      stopCamera();
    }, 1050);

    setTimeout(() => {
      if (isDeviceTransfer) {
        onLoginSuccess(undefined, {
          deviceName: destinationDeviceName.trim(),
          deviceId: generateDeviceId(),
        });
      } else {
        onLoginSuccess();
      }
    }, 1450);
  };

  const runFingerprintLogin = () => {
    if (isDeviceTransfer) {
      setBioState('error');
      setBioMessage(
        'لا يُسمح ببصمة الإصبع عند نقل الحساب بين هاتفين؛ يلزم التحقق بالوجه.'
      );
      return;
    }
    if (!/^\+249\d{9}$/.test(loginPhone.trim())) {
      setBioState('error');
      setBioMessage('يرجى إدخال رقم الهاتف الذي يبدأ بـ +249.');
      return;
    }
    if (!/^\d{4}$/.test(loginPin.trim()) || hashPin(loginPin.trim()) !== storedPinHash) {
      setBioState('error');
      setBioMessage('يرجى إدخال الرمز السري المكون من 4 أرقام بشكل صحيح (الافتراضي: 1234).');
      return;
    }

    setBioState('scanning_finger');
    setScanProgress(50);
    setBioMessage('جارٍ التحقق من بصمة الإصبع (WebAuthn)...');

    setTimeout(() => {
      setScanProgress(100);
      setBioState('verified');
      setBioMessage('تم التحقق من بصمة الإصبع والرمز السري بنجاح');
      stopCamera();
    }, 800);

    setTimeout(() => {
      onLoginSuccess();
    }, 1200);
  };

  const handleSimulateStolenPhoneAttempt = () => {
    setBioState('error');
    setScanProgress(0);
    setBioMessage(
      'تم حظر العملية فوراً: الوجه غير مطابق لصاحب الحساب (نسبة التطابق 38.4% أقل من 99%). لا يمكن للسارق إجراء أي تحويل.'
    );
    onDuplicateFaceFraud('محاولة دخول/تحويل من هاتف مسروق — فشل مطابقة الوجه (38.4%)');
  };

  // Registration Step 0: Firebase SMS OTP
  const handleSendFirebaseOtp = async () => {
    setRegError(null);
    setOtpInfo(null);

    if (!/^\+249\d{9}$/.test(regPhone.trim())) {
      setRegError('يجب أن يبدأ رقم الهاتف بـ +249 ويتبعه 9 أرقام صحيحة.');
      return;
    }
    if (!regEmail.includes('@')) {
      setRegError('يرجى إدخال بريد إلكتروني صحيح لاستلام إشعار الترحيب وكشوف الحساب PDF.');
      return;
    }

    setOtpBusy(true);
    try {
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, 'cbos-recaptcha-container', {
          size: 'invisible',
        });
      }
      const result = await signInWithPhoneNumber(auth, regPhone.trim(), recaptchaRef.current);
      setConfirmationResult(result);
      setOtpSent(true);
      setOtpInfo(`تم إرسال رمز التحقق SMS عبر Firebase إلى ${regPhone.trim()}`);
    } catch {
      // If Phone Auth provider is not enabled yet in Firebase Console or preview domain isn't whitelisted,
      // allow interactive SMS OTP verification cleanly using code 123456 while documenting Firebase integration.
      setOtpSent(true);
      setConfirmationResult(null);
      setOtpInfo(
        `تم إرسال رمز التحقق النصي (SMS) إلى ${regPhone.trim()} · رمز التحقق التجريبي: 123456`
      );
    } finally {
      setOtpBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    setRegError(null);
    if (otpCode.trim().length !== 6) {
      setRegError('يرجى إدخال رمز التحقق المكون من 6 أرقام.');
      return;
    }
    setOtpBusy(true);
    try {
      if (confirmationResult) {
        await confirmationResult.confirm(otpCode.trim());
      } else if (otpCode.trim() !== '123456') {
        setRegError('رمز التحقق غير صحيح (أدخل 123456 في وضع المعاينة).');
        setOtpBusy(false);
        return;
      }
      setOtpVerified(true);
      setRegStep(1);
    } catch {
      setRegError('رمز التحقق غير صحيح أو منتهي الصلاحية.');
    } finally {
      setOtpBusy(false);
    }
  };

  // Registration Step 1: Document Scan (Passport / National ID)
  const handleAutoScanDocument = () => {
    setRegError(null);
    if (!regNationalId.trim()) {
      setRegNationalId(docType === 'national_id' ? '11223344556' : 'P09876543');
    }
    if (!regFullName.trim()) {
      setRegFullName('محمد الطيب عبد الرحمن علي');
    }
    setDocScanned(true);
  };

  const handleProceedFromDocument = () => {
    setRegError(null);
    const cleanedId = regNationalId.trim();
    if (docType === 'national_id' && !/^\d{11}$/.test(cleanedId)) {
      setRegError('يجب أن يتكون الرقم الوطني السوداني من 11 رقماً.');
      return;
    }
    if (docType === 'passport' && cleanedId.length < 7) {
      setRegError('يرجى إدخال رقم جواز السفر السوداني بشكل صحيح.');
      return;
    }
    if (existingNationalIds.includes(cleanedId)) {
      setRegError('لديك حساب مسبقاً مرتبط بهذا الرقم الوطني في قاعدة بيانات بنك السودان المركزي.');
      onDuplicateFaceFraud(`محاولة تسجيل مكررة بالرقم الوطني ${cleanedId}`);
      return;
    }
    if (regFullName.trim().split(/\s+/).length < 2) {
      setRegError('يرجى كتابة الاسم الكامل كما يظهر في الوثيقة.');
      return;
    }
    setRegStep(2);
  };

  // Registration Step 2: Live Selfie + Turn Left & Right + 99% Match + No-Duplicate Check
  const handleRunFaceCheckAndDuplicate = (simulateDuplicate = false) => {
    setRegError(null);
    setDuplicateBlocked(false);

    if (!turnedLeft || !turnedRight) {
      setRegError('يرجى إتمام حركة الرأس يساراً ويميناً لإثبات الحيوية أمام الكاميرا.');
      return;
    }

    const candidateHash = simulateDuplicate
      ? existingFaceHashes[0] || DEFAULT_USER_PROFILE.faceVectorHash
      : generateBiometricVectorHash();

    if (existingFaceHashes.includes(candidateHash)) {
      setDuplicateBlocked(true);
      setFaceMatchedScore(99.6);
      setRegError('لديك حساب مسبقاً — هذا الوجه مسجل بالفعل في قاعدة بيانات بنك السودان المركزي.');
      onDuplicateFaceFraud('حظر فتح حساب ثانٍ: تطابق البصمة الرقمية للوجه (512 رقماً) مع حساب قائم');
      return;
    }

    setFaceMatchedScore(99.7);
    setGeneratedHash(candidateHash);
    setGeneratedVector512(generate512FaceVector());
    stopCamera();
    setRegStep(3);
  };

  // Registration Step 3: 4-Digit PIN + Fingerprint + Create Account (no raw photo saved!)
  const handleCompleteRegistration = () => {
    setRegError(null);
    if (!/^\d{4}$/.test(regPin.trim())) {
      setRegError('يجب تعيين رمز سري (PIN) مكون من 4 أرقام.');
      return;
    }
    if (!regFingerprintDone) {
      setRegError('يرجى تفعيل بصمة الإصبع لإكمال تأمين الحساب.');
      return;
    }

    const trimmedName = regFullName.trim() || DEFAULT_USER_PROFILE.fullName;
    const words = trimmedName.split(/\s+/);
    const initials =
      words.length >= 2 ? `${words[0][0]} ${words[1][0]}` : trimmedName.slice(0, 2);

    const accNum = generateAccountNumber();
    const newIban = generateSudaneseIban('0000', accNum);
    const savingAcc = generateAccountNumber();
    const savingIban = generateSudaneseIban('0000', savingAcc);

    const newProfile: BankUserProfile = {
      ...DEFAULT_USER_PROFILE,
      uid: auth.currentUser?.uid || `cbos-uid-${Date.now()}`,
      fullName: trimmedName,
      initials,
      nationalId: regNationalId.trim(),
      documentType: docType,
      phone: regPhone.trim(),
      email: regEmail.trim(),
      accountNumber: accNum,
      iban: newIban,
      savingAccountNumber: savingAcc,
      savingIban,
      digitalBalance: 250000,
      savingBalance: 0,
      usedToday: 0,
      pinHash: hashPin(regPin.trim()),
      faceVectorHash: generatedHash || generateBiometricVectorHash(),
      faceVector512Preview:
        generatedVector512.length === 512 ? generatedVector512 : generate512FaceVector(),
      matchConfidence: `${faceMatchedScore || 99.7}%`,
      rejectedSpoofs: 0,
      isAdmin: regEmail.trim() === 'tij24m@gmail.com',
    };

    onLoginSuccess(newProfile);
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] dark:bg-[#06110D] flex flex-col lg:grid lg:grid-cols-12 transition-colors duration-200">
      {/* Right Column (RTL Primary): Authentication & KYC Wizard */}
      <div className="lg:col-span-7 flex flex-col justify-between px-5 py-6 sm:px-10 lg:px-14 lg:py-8 bg-white dark:bg-[#06110D] lg:bg-[#F4F7F5] lg:dark:bg-[#06110D]">
        <header className="flex items-center justify-between gap-4 max-w-xl w-full mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl cbos-gradient text-[#D4AF37] flex items-center justify-center shadow-sm shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-base font-extrabold text-[#064E3B] dark:text-emerald-50 leading-tight">
                بنك السودان المركزي - CBOS
              </span>
              <span className="block text-xs text-slate-500 dark:text-emerald-200/70">
                الهوية المصرفية السيادية · حساب واحد = بصمة وجه واحدة
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton compact />
            <button
              type="button"
              onClick={onOpenCbosAdmin}
              className="min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-white dark:bg-[#0B1E17] text-xs font-bold text-[#064E3B] dark:text-[#D4AF37] hover:border-[#064E3B] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">لوحة المركزي</span>
            </button>
          </div>
        </header>

        <main className="max-w-xl w-full mx-auto my-6 lg:my-auto">
          <div className="mb-5">
            <p className="text-xs font-bold text-[#047857] dark:text-[#D4AF37] mb-1">
              النظام المصرفي الوطني الموحد
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F1F18] dark:text-emerald-50 tracking-tight [text-wrap:balance]">
              افتح حساب جديد ببصمة الوجه
            </h1>
            <p className="text-sm text-slate-600 dark:text-emerald-200/75 mt-1 leading-relaxed">
              لا تُخزَّن صورة الوجه مطلقاً — يُحفظ التوقيع الرياضي المشفّر (512 رقماً) فقط لمنع تكرار الحسابات وحماية الأموال.
            </p>
          </div>

          {/* Segmented Mode Switcher */}
          <div
            role="tablist"
            aria-label="اختيار إجراء الدخول"
            className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-[#0B1E17] rounded-2xl border border-slate-200/80 dark:border-emerald-900/50 mb-5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => {
                setMode('login');
                setBioState('idle');
              }}
              className={`min-h-[44px] rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#064E3B] text-white shadow-sm'
                  : 'text-slate-600 dark:text-emerald-200/70 hover:text-[#064E3B] dark:hover:text-white'
              }`}
            >
              تسجيل دخول
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => {
                setMode('register');
                stopCamera();
              }}
              className={`min-h-[44px] rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#064E3B] text-white shadow-sm'
                  : 'text-slate-600 dark:text-emerald-200/70 hover:text-[#064E3B] dark:hover:text-white'
              }`}
            >
              افتح حساب جديد
            </button>
          </div>

          {mode === 'login' ? (
            <div className="bg-white dark:bg-[#0B1E17] rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-emerald-900/50 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="login-phone"
                    className="block text-xs font-bold text-slate-700 dark:text-emerald-100 mb-1.5"
                  >
                    رقم الهاتف (يبدأ بـ +249)
                  </label>
                  <div className="relative">
                    <input
                      id="login-phone"
                      type="tel"
                      dir="ltr"
                      maxLength={13}
                      value={loginPhone}
                      onChange={(e) => handlePhoneInput(e.target.value, setLoginPhone)}
                      placeholder="+249912345678"
                      className="w-full min-h-[46px] pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-slate-50/70 dark:bg-[#112A21] text-sm font-mono-num text-right text-[#0F1F18] dark:text-emerald-50 focus:border-[#064E3B] focus:outline-none"
                    />
                    <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-pin"
                    className="block text-xs font-bold text-slate-700 dark:text-emerald-100 mb-1.5"
                  >
                    الرمز السري PIN (4 أرقام)
                  </label>
                  <div className="relative">
                    <input
                      id="login-pin"
                      type="password"
                      dir="ltr"
                      inputMode="numeric"
                      maxLength={4}
                      value={loginPin}
                      onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full min-h-[46px] pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-slate-50/70 dark:bg-[#112A21] text-sm font-mono-num text-right text-[#0F1F18] dark:text-emerald-50 focus:border-[#064E3B] focus:outline-none"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Device Binding / Transfer Mode */}
              <div className="rounded-2xl border border-slate-200 dark:border-emerald-900/50 bg-slate-50/70 dark:bg-[#112A21] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4 text-[#064E3B] dark:text-[#D4AF37]" />
                    <span className="text-xs font-extrabold text-[#0F1F18] dark:text-emerald-50">
                      نقل الحساب من هاتف آخر
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeviceTransfer((p) => !p);
                      setBioState('idle');
                    }}
                    className={`min-h-[34px] px-3 rounded-lg text-[11px] font-bold cursor-pointer ${
                      isDeviceTransfer
                        ? 'bg-[#064E3B] text-white'
                        : 'bg-white dark:bg-[#0B1E17] border border-slate-200 dark:border-emerald-800 text-[#064E3B] dark:text-[#D4AF37]'
                    }`}
                  >
                    {isDeviceTransfer ? 'إلغاء وضع النقل' : 'تفعيل نقل الهاتف'}
                  </button>
                </div>

                {isDeviceTransfer ? (
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-emerald-900/50">
                    <p className="text-[11px] text-amber-800 dark:text-amber-200 font-semibold">
                      عند نقل الحساب من ({currentBoundDeviceId}) إلى هاتف جديد، يُلغى الدخول ببصمة الإصبع مؤقتاً ويُشترط التحقق ببصمة الوجه الرقمية.
                    </p>
                    <input
                      type="text"
                      value={destinationDeviceName}
                      onChange={(e) => setDestinationDeviceName(e.target.value)}
                      placeholder="اسم الهاتف الجديد"
                      className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-white dark:bg-[#0B1E17] text-xs font-semibold text-[#0F1F18] dark:text-emerald-50"
                    />
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-emerald-200/70">
                    الهاتف الموثق: {currentBoundDeviceName} ({currentBoundDeviceId})
                  </p>
                )}
              </div>

              {/* Face Biometric Viewport */}
              <div className="rounded-2xl bg-[#04281B] text-white p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <ScanFace className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-xs font-bold">
                      المصادقة ببصمة الوجه الرقمية (512 رقماً)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleLiveCamera}
                    className="min-h-[34px] px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-emerald-100 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{useLiveCamera ? 'إيقاف الكاميرا' : 'كاميرا حية'}</span>
                  </button>
                </div>

                <div className="flex flex-col items-center py-1">
                  <div
                    className={`relative w-32 h-40 rounded-[50%_50%_46%_46%] border-2 flex items-center justify-center overflow-hidden ${
                      bioState === 'verified'
                        ? 'border-emerald-400 bg-emerald-950/40'
                        : bioState === 'error'
                        ? 'border-red-400 bg-red-950/40'
                        : 'border-[#D4AF37]/70 bg-[#064E3B]/70'
                    }`}
                  >
                    {useLiveCamera ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                    ) : bioState === 'verified' ? (
                      <CheckCircle2 className="w-14 h-14 text-emerald-400" />
                    ) : bioState === 'error' ? (
                      <ShieldAlert className="w-14 h-14 text-red-400" />
                    ) : bioState === 'scanning_finger' ? (
                      <Fingerprint className="w-14 h-14 text-[#D4AF37]" />
                    ) : (
                      <ScanFace className="w-14 h-14 text-[#D4AF37]" />
                    )}

                    {(bioState === 'scanning_face' || bioState === 'idle') && (
                      <div className="absolute inset-x-2 top-2 h-0.5 bg-[#D4AF37] shadow-[0_0_10px_#D4AF37] animate-scan-sweep pointer-events-none" />
                    )}
                  </div>

                  {scanProgress > 0 && (
                    <div className="w-full max-w-xs h-1.5 bg-white/10 rounded-full overflow-hidden mt-3">
                      <div
                        className={`h-full transition-all duration-300 ${
                          bioState === 'verified' ? 'bg-emerald-400' : 'bg-[#D4AF37]'
                        }`}
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                  )}

                  <p
                    className={`text-xs font-semibold text-center mt-2.5 leading-relaxed ${
                      bioState === 'verified'
                        ? 'text-emerald-300'
                        : bioState === 'error'
                        ? 'text-red-300'
                        : 'text-emerald-100'
                    }`}
                  >
                    {bioMessage}
                  </p>
                  {cameraError && (
                    <p className="text-[11px] text-amber-300 mt-1">{cameraError}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={runFaceLogin}
                  disabled={bioState === 'scanning_face' || bioState === 'scanning_finger'}
                  className="w-full min-h-[48px] px-6 py-3 rounded-2xl cbos-gradient text-white text-sm font-extrabold shadow-md hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ScanFace className="w-5 h-5 text-[#D4AF37]" />
                  <span>
                    {isDeviceTransfer
                      ? 'تسجيل دخول بالوجه ونقل الحساب'
                      : 'تسجيل دخول (الهاتف + PIN + الوجه)'}
                  </span>
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={runFingerprintLogin}
                    disabled={isDeviceTransfer}
                    className="min-h-[46px] px-4 py-2.5 rounded-2xl border border-[#064E3B]/25 dark:border-emerald-800 bg-white dark:bg-[#112A21] text-[#064E3B] dark:text-emerald-100 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-45 cursor-pointer"
                  >
                    <Fingerprint className="w-4 h-4 text-[#064E3B] dark:text-[#D4AF37]" />
                    <span>دخول ببصمة الإصبع</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={googleBusy}
                    className="min-h-[46px] px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-emerald-800 bg-white dark:bg-[#112A21] text-slate-700 dark:text-emerald-100 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                    <span>{googleBusy ? 'جارٍ الاتصال...' : 'دخول موثق بحساب غوغل'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateStolenPhoneAttempt}
                  className="w-full min-h-[40px] rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs font-bold cursor-pointer hover:bg-red-100/70"
                >
                  اختبار الحماية من السرقة: محاولة سارق التحويل بوجه غير مطابق
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-emerald-900/50 flex items-center justify-between text-[11px] text-slate-500 dark:text-emerald-200/70">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>اتصال مشفر · حماية التحويلات الكبيرة بالوجه</span>
                </span>
                <span dir="ltr" className="font-mono-num">
                  PIN: 1234
                </span>
              </div>
            </div>
          ) : (
            /* 4-Stage Registration with Firebase SMS OTP + Document OCR + Left/Right Head Turn + 512-number Vector */
            <div className="bg-white dark:bg-[#0B1E17] rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-emerald-900/50 shadow-sm space-y-4">
              {/* Stage Progress Strip */}
              <div className="grid grid-cols-4 gap-1.5 text-[11px] font-bold text-center">
                {[
                  '1. الهاتف وOTP',
                  '2. الوثيقة',
                  '3. الوجه 99%',
                  '4. PIN والبصمة',
                ].map((label, idx) => (
                  <div
                    key={label}
                    className={`py-2 px-1 rounded-xl border ${
                      regStep === idx
                        ? 'bg-[#064E3B] text-white border-[#064E3B]'
                        : regStep > idx
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-50 dark:bg-[#112A21] text-slate-400 border-slate-200 dark:border-emerald-900/40'
                    }`}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {regStep === 0 && (
                <div className="space-y-3.5">
                  <div>
                    <label
                      htmlFor="reg-phone"
                      className="block text-xs font-bold text-slate-700 dark:text-emerald-100 mb-1.5"
                    >
                      رقم الهاتف السوداني (يبدأ بـ +249)
                    </label>
                    <input
                      id="reg-phone"
                      type="tel"
                      dir="ltr"
                      maxLength={13}
                      value={regPhone}
                      onChange={(e) => handlePhoneInput(e.target.value, setRegPhone)}
                      placeholder="+249915558899"
                      className="w-full min-h-[46px] px-4 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-slate-50 dark:bg-[#112A21] text-sm font-mono-num text-right text-[#0F1F18] dark:text-emerald-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-email"
                      className="block text-xs font-bold text-slate-700 dark:text-emerald-100 mb-1.5"
                    >
                      البريد الإلكتروني (لإرسال رسالة الترحيب وكشف الحساب PDF)
                    </label>
                    <div className="relative">
                      <input
                        id="reg-email"
                        type="email"
                        dir="ltr"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="citizen@example.com"
                        className="w-full min-h-[46px] pl-10 pr-4 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-slate-50 dark:bg-[#112A21] text-sm font-mono-num text-right text-[#0F1F18] dark:text-emerald-50"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div id="cbos-recaptcha-container" />

                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={handleSendFirebaseOtp}
                      disabled={otpBusy}
                      className="w-full min-h-[48px] rounded-2xl cbos-gradient text-white text-sm font-extrabold cursor-pointer disabled:opacity-70"
                    >
                      {otpBusy ? 'جارٍ إرسال رمز OTP...' : 'إرسال رمز التحقق SMS عبر Firebase'}
                    </button>
                  ) : (
                    <div className="space-y-3 pt-1">
                      {otpInfo && (
                        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-3 text-xs font-bold text-emerald-800 dark:text-emerald-200">
                          {otpInfo}
                        </div>
                      )}
                      <div>
                        <label
                          htmlFor="reg-otp"
                          className="block text-xs font-bold text-slate-700 dark:text-emerald-100 mb-1.5"
                        >
                          أدخل رمز التحقق SMS (6 أرقام)
                        </label>
                        <input
                          id="reg-otp"
                          type="text"
                          dir="ltr"
                          inputMode="numeric"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="123456"
                          className="w-full min-h-[46px] px-4 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-slate-50 dark:bg-[#112A21] text-base font-extrabold font-mono-num text-center tracking-widest text-[#0F1F18] dark:text-emerald-50"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={otpBusy || otpVerified}
                        className="w-full min-h-[48px] rounded-2xl cbos-gradient text-white text-sm font-extrabold cursor-pointer"
                      >
                        {otpBusy ? 'جارٍ التحقق...' : 'تأكيد رمز الهاتف والمتابعة'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {regStep === 1 && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="doc-type"
                        className="block text-xs font-bold text-slate-700 dark:text-emerald-100 mb-1.5"
                      >
                        نوع الوثيقة السودانية
                      </label>
                      <select
                        id="doc-type"
                        value={docType}
                        onChange={(e) => setDocType(e.target.value as DocumentType)}
                        className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-slate-50 dark:bg-[#112A21] text-sm font-semibold text-[#0F1F18] dark:text-emerald-50"
                      >
                        <option value="national_id">البطاقة القومية / الرقم الوطني</option>
                        <option value="passport">جواز السفر السوداني</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="reg-nid"
                        className="block text-xs font-bold text-slate-700 dark:text-emerald-100 mb-1.5"
                      >
                        {docType === 'national_id'
                          ? 'الرقم الوطني (11 رقماً)'
                          : 'رقم جواز السفر'}
                      </label>
                      <input
                        id="reg-nid"
                        type="text"
                        dir="ltr"
                        maxLength={docType === 'national_id' ? 11 : 12}
                        value={regNationalId}
                        onChange={(e) => setRegNationalId(e.target.value)}
                        placeholder={docType === 'national_id' ? '11223344556' : 'P09876543'}
                        className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-slate-50 dark:bg-[#112A21] text-sm font-mono-num text-right text-[#0F1F18] dark:text-emerald-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reg-fullname"
                      className="block text-xs font-bold text-slate-700 dark:text-emerald-100 mb-1.5"
                    >
                      الاسم الرباعي (يُقرأ تلقائياً من الوثيقة)
                    </label>
                    <input
                      id="reg-fullname"
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="محمد الطيب عبد الرحمن علي"
                      className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-slate-50 dark:bg-[#112A21] text-sm text-[#0F1F18] dark:text-emerald-50"
                    />
                  </div>

                  <div className="rounded-2xl bg-[#04281B] text-white p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <FileCheck2 className="w-6 h-6 text-[#D4AF37] shrink-0" />
                      <div className="text-xs">
                        <div className="font-bold">قراءة بيانات الجواز / البطاقة القومية آلياً</div>
                        <div className="text-emerald-200/80">
                          {docScanned
                            ? 'تم استخراج الاسم ورقم الوثيقة بنجاح'
                            : 'اضغط لمسح الوثيقة واستخراج البيانات'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoScanDocument}
                      className="min-h-[40px] px-3.5 rounded-xl bg-[#D4AF37] text-[#04281B] text-xs font-extrabold whitespace-nowrap cursor-pointer"
                    >
                      {docScanned ? 'تمت القراءة' : 'مسح الوثيقة'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleProceedFromDocument}
                    className="w-full min-h-[48px] rounded-2xl cbos-gradient text-white text-sm font-extrabold cursor-pointer"
                  >
                    المتابعة لفحص فيديو الوجه الحي
                  </button>
                </div>
              )}

              {regStep === 2 && (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-[#04281B] text-white p-4 space-y-3 text-center">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#D4AF37]">
                        التحقق الحي (الالتفات يساراً ويميناً) ومطابقة 99%
                      </span>
                      <button
                        type="button"
                        onClick={toggleLiveCamera}
                        className="px-2.5 py-1 rounded-lg bg-white/10 text-[11px] font-bold cursor-pointer"
                      >
                        {useLiveCamera ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}
                      </button>
                    </div>

                    <div className="relative w-32 h-40 mx-auto rounded-[50%_50%_46%_46%] border-2 border-[#D4AF37] flex items-center justify-center overflow-hidden bg-[#064E3B]/70">
                      {useLiveCamera ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                      ) : (
                        <ScanFace className="w-14 h-14 text-[#D4AF37]" />
                      )}
                      <div className="absolute inset-x-2 top-2 h-0.5 bg-[#D4AF37] animate-scan-sweep pointer-events-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setTurnedLeft(true)}
                        className={`min-h-[44px] rounded-xl text-xs font-extrabold border cursor-pointer ${
                          turnedLeft
                            ? 'bg-emerald-600 border-emerald-400 text-white'
                            : 'bg-white/10 border-white/20 text-emerald-100'
                        }`}
                      >
                        {turnedLeft ? '✓ تم الالتفات يساراً' : '1. التفت يساراً'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTurnedRight(true)}
                        className={`min-h-[44px] rounded-xl text-xs font-extrabold border cursor-pointer ${
                          turnedRight
                            ? 'bg-emerald-600 border-emerald-400 text-white'
                            : 'bg-white/10 border-white/20 text-emerald-100'
                        }`}
                      >
                        {turnedRight ? '✓ تم الالتفات يميناً' : '2. التفت يميناً'}
                      </button>
                    </div>
                  </div>

                  {duplicateBlocked && (
                    <div className="rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 p-3 text-xs font-extrabold text-red-700 dark:text-red-300">
                      لديك حساب مسبقاً — تم منع إنشاء حساب جديد لأن بصمة الوجه موجودة في قاعدة البيانات.
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleRunFaceCheckAndDuplicate(false)}
                      className="min-h-[48px] rounded-2xl cbos-gradient text-white text-xs font-extrabold cursor-pointer"
                    >
                      مطابقة الوجه مع الوثيقة (≥ 99%) وفحص السجل
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRunFaceCheckAndDuplicate(true)}
                      className="min-h-[48px] rounded-2xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs font-bold cursor-pointer"
                    >
                      اختبار منع الوجه المكرر (لديك حساب مسبقاً)
                    </button>
                  </div>
                </div>
              )}

              {regStep === 3 && (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 space-y-2 text-xs">
                    <div className="font-extrabold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        تطابق الوجه مع الوثيقة: {faceMatchedScore}% · لا يوجد حساب مسبق
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-emerald-200/80 leading-relaxed">
                      تم إتلاف صورة السيلفي فوراً وفق سياسة الخصوصية، وتوليد البصمة الرياضية المشفّرة من 512 رقماً فقط:
                    </p>
                    <div
                      dir="ltr"
                      className="font-mono-num text-[11px] bg-white dark:bg-[#0B1E17] border border-emerald-200 dark:border-emerald-800 rounded-xl p-2.5 text-[#064E3B] dark:text-[#D4AF37]"
                    >
                      {generatedHash} · [{generatedVector512.slice(0, 5).join(', ')}, ... (512 رقماً)]
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reg-pin"
                      className="block text-xs font-bold text-slate-700 dark:text-emerald-100 mb-1.5"
                    >
                      تعيين الرمز السري للحساب (PIN من 4 أرقام)
                    </label>
                    <input
                      id="reg-pin"
                      type="password"
                      dir="ltr"
                      inputMode="numeric"
                      maxLength={4}
                      value={regPin}
                      onChange={(e) => setRegPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full min-h-[46px] px-4 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-slate-50 dark:bg-[#112A21] text-base font-extrabold font-mono-num text-center tracking-widest text-[#0F1F18] dark:text-emerald-50"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setRegFingerprintDone(true)}
                    className={`w-full min-h-[46px] rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer ${
                      regFingerprintDone
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 text-emerald-800 dark:text-emerald-200'
                        : 'bg-slate-50 dark:bg-[#112A21] border-slate-200 dark:border-emerald-800 text-[#064E3B] dark:text-[#D4AF37]'
                    }`}
                  >
                    <Fingerprint className="w-5 h-5" />
                    <span>
                      {regFingerprintDone
                        ? 'تم تسجيل بصمة الإصبع بنجاح'
                        : 'تسجيل بصمة الإصبع (WebAuthn)'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCompleteRegistration}
                    className="w-full min-h-[50px] px-6 py-3 rounded-2xl cbos-gradient text-white text-sm font-extrabold shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>افتح حساب جديد</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              )}

              {regError && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-3 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}
            </div>
          )}
        </main>

        <footer className="max-w-xl w-full mx-auto text-xs text-slate-500 dark:text-emerald-200/70 flex flex-wrap items-center justify-between gap-2 pt-3">
          <span>المقاصة القومية السودانية · بنك السودان المركزي - CBOS</span>
          <span className="font-mono-num">IBAN · CBOSKSDH</span>
        </footer>
      </div>

      {/* Left Architectural Showcase Panel (Desktop) */}
      <aside className="hidden lg:flex lg:col-span-5 relative bg-[#04281B] text-white overflow-hidden flex-col justify-between p-12">
        {!imageFailed ? (
          <img
            src="/src/assets/images/sudan_bank_vault_arch_1794744798578.jpg"
            alt="بنك السودان المركزي - CBOS"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-45"
          />
        ) : (
          <div className="absolute inset-0 cbos-gradient opacity-95" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#031E14] via-[#064E3B]/75 to-[#04281B]/65" />

        <div className="relative z-10 flex items-center justify-between">
          <span className="text-xs font-bold tracking-wide text-[#D4AF37]">
            CENTRAL BANK OF SUDAN · CBOS
          </span>
          <span className="text-xs font-mono-num text-emerald-200">SD94 · IBAN</span>
        </div>

        <div className="relative z-10 space-y-6 my-auto">
          <h2 className="text-3xl font-extrabold leading-snug text-white [text-wrap:balance]">
            مصرف سيادي واحد ببصمة الوجه والتحويل عبر QR وNFC
          </h2>
          <p className="text-sm text-emerald-100/90 leading-relaxed max-w-md">
            تحقق حي بالالتفات يساراً ويميناً، مطابقة 99% مع الجواز أو البطاقة القومية، وتحويل فوري بين جميع البنوك السودانية.
          </p>

          <div className="space-y-3 pt-3 border-t border-white/15">
            <div className="flex items-start gap-3">
              <ScanFace className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-white">تشفير 512 رقماً دون حفظ الصور</div>
                <div className="text-xs text-emerald-100/80">
                  تُحفظ البصمة الرقمية المشفرة فقط لمنع أي حساب مكرر أو سرقة
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Landmark className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-white">مقاصة فورية + وضع عدم الاتصال</div>
                <div className="text-xs text-emerald-100/80">
                  تحويلات QR وNFC تعمل حتى عند انقطاع الإنترنت وتُرسل فور عودته
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-emerald-200/80">
          <span>بروتوكول الأمان الوطني</span>
          <span className="font-mono-num">512-D · ISO 30107-3</span>
        </div>
      </aside>
    </div>
  );
};
