import { useCallback, useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Bell,
  FileSpreadsheet,
  Home,
  Landmark,
  LogOut,
  Mail,
  ShieldCheck,
  Smartphone,
  User,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  BankTransaction,
  BankUserProfile,
  DispatchNotification,
  FraudAlertRecord,
  NavTab,
  SudaneseBank,
  WeeklyStatement,
} from './types/bank';
import {
  CBOS_BANK_CODE,
  DEFAULT_USER_PROFILE,
  INITIAL_DISPATCH_LOGS,
  INITIAL_FRAUD_ALERTS,
  INITIAL_TRANSACTIONS,
  INITIAL_WEEKLY_STATEMENTS,
  formatSdg,
} from './data/sudanBanks';
import {
  OperationType,
  auth,
  db,
  handleFirestoreError,
  testFirestoreConnection,
} from './firebase';
import { AuthScreen } from './components/AuthScreen';
import { HomeScreen } from './components/HomeScreen';
import { AccountScreen } from './components/AccountScreen';
import { StatementsScreen } from './components/StatementsScreen';
import { AdminDashboardScreen } from './components/AdminDashboardScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { TransferModal } from './components/TransferModal';
import { QrTransferModal } from './components/QrTransferModal';
import { NfcTransferModal } from './components/NfcTransferModal';
import { DepositModal } from './components/DepositModal';
import { PayBillsModal } from './components/PayBillsModal';
import { DeviceTransferModal } from './components/DeviceTransferModal';
import { SystemShadeOverlay } from './components/SystemShadeOverlay';
import { NotificationsLogModal } from './components/NotificationsLogModal';
import { ToastContainer, ToastItem } from './components/ToastContainer';
import { PWAInstallButton } from './components/PWAInstallButton';
import { usePowerSaving } from './hooks/usePowerSaving';

const OFFLINE_QUEUE_KEY = 'cbos_offline_queue_v1';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [user, setUser] = useState<BankUserProfile>(DEFAULT_USER_PROFILE);
  const [transactions, setTransactions] =
    useState<BankTransaction[]>(INITIAL_TRANSACTIONS);
  const [statements, setStatements] =
    useState<WeeklyStatement[]>(INITIAL_WEEKLY_STATEMENTS);
  const [fraudAlerts, setFraudAlerts] =
    useState<FraudAlertRecord[]>(INITIAL_FRAUD_ALERTS);
  const [dispatchLogs, setDispatchLogs] =
    useState<DispatchNotification[]>(INITIAL_DISPATCH_LOGS);

  const [registeredNationalIds, setRegisteredNationalIds] = useState<string[]>([
    DEFAULT_USER_PROFILE.nationalId,
    '11420098890',
  ]);
  const [registeredFaceHashes, setRegisteredFaceHashes] = useState<string[]>([
    DEFAULT_USER_PROFILE.faceVectorHash,
  ]);
  const [totalRealAccounts, setTotalRealAccounts] = useState<number>(2);

  const [isOffline, setIsOffline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('sudan_bank_theme') === 'dark';
  });
  const {
    isPowerSavingEnabled,
    togglePowerSaving,
    batteryLevel,
    isCharging,
    isLowBattery,
    syncIntervalMs,
  } = usePowerSaving();
  const [lastBalanceSyncLabel, setLastBalanceSyncLabel] = useState<string>('الآن');

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isNfcOpen, setIsNfcOpen] = useState(false);
  const [isBillsOpen, setIsBillsOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isDeviceTransferOpen, setIsDeviceTransferOpen] = useState(false);
  const [isShadeOpen, setIsShadeOpen] = useState(false);
  const [isNotifLogOpen, setIsNotifLogOpen] = useState(false);
  const [isPreAuthAdminOpen, setIsPreAuthAdminOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('sudan_bank_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    testFirestoreConnection();
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load any saved offline transfers on startup
  useEffect(() => {
    try {
      const saved = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (saved) {
        const queued = JSON.parse(saved) as BankTransaction[];
        if (queued.length > 0) {
          setTransactions((prev) => {
            const existingIds = new Set(prev.map((t) => t.id));
            const uniqueQueued = queued.filter((q) => !existingIds.has(q.id));
            return [...uniqueQueued, ...prev];
          });
        }
      }
    } catch {
      // Ignore malformed local cache
    }
  }, []);

  // Support Android Home Screen shortcut actions (?action=qr|nfc|statements)
  useEffect(() => {
    if (!isAuthenticated) return;
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'qr') setIsQrOpen(true);
    else if (action === 'nfc') setIsNfcOpen(true);
    else if (action === 'statements') setActiveTab('statements');
  }, [isAuthenticated]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback(
    (title: string, description: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [
        ...prev.slice(-2),
        { id, title, description, type: 'success' },
      ]);
      setTimeout(() => {
        dismissToast(id);
      }, 4800);
    },
    [dismissToast]
  );

  const canPersistToFirestore = () => {
    const u = auth.currentUser;
    return Boolean(u && (u.emailVerified || u.phoneNumber));
  };

  const logDispatch = useCallback(
    async (kind: 'SMS' | 'EMAIL', recipient: string, subject: string, body: string) => {
      const logId = `dsp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const entry: DispatchNotification = {
        id: logId,
        kind,
        recipient,
        subject,
        body,
        timestamp: 'الآن',
      };
      setDispatchLogs((prev) => [entry, ...prev]);

      if (canPersistToFirestore() && auth.currentUser) {
        try {
          await setDoc(doc(db, 'notificationsLog', logId), {
            ownerUid: auth.currentUser.uid,
            kind,
            recipient,
            subject,
            body,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `notificationsLog/${logId}`);
        }
      }
    },
    []
  );

  // Sync Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) return;
      try {
        const accSnap = await getDocs(
          query(collection(db, 'accounts'), where('uid', '==', fbUser.uid))
        );
        if (!accSnap.empty) {
          const data = accSnap.docs[0].data();
          setUser((prev) => ({
            ...prev,
            uid: fbUser.uid,
            fullName: String(data.fullName || prev.fullName),
            nationalId: String(data.nationalId || prev.nationalId),
            phone: String(data.phone || prev.phone),
            email: String(data.email || fbUser.email || prev.email),
            accountNumber: String(data.accountNumber || prev.accountNumber),
            iban: String(data.iban || prev.iban),
            digitalBalance:
              typeof data.balance === 'number' ? data.balance : prev.digitalBalance,
            faceVectorHash: String(data.faceVectorHash || prev.faceVectorHash),
            boundDeviceId: String(data.boundDeviceId || prev.boundDeviceId),
            boundDeviceName: String(data.boundDeviceName || prev.boundDeviceName),
            cardFrozen: data.status === 'frozen',
            isAdmin: fbUser.email === 'tij24m@gmail.com',
          }));
        }
      } catch {
        // Non-fatal preview fallback if rules require verified phone/email first
      }
    });
    return () => unsub();
  }, []);

  // Adaptive background balance refresh governed by Power Saving Mode and battery level
  useEffect(() => {
    if (!isAuthenticated || isOffline) return;

    const refreshBalanceInBackground = async () => {
      if (isPowerSavingEnabled && isLowBattery && document.visibilityState === 'hidden') {
        return;
      }
      if (canPersistToFirestore() && auth.currentUser) {
        try {
          const accSnap = await getDocs(
            query(collection(db, 'accounts'), where('uid', '==', auth.currentUser.uid))
          );
          if (!accSnap.empty) {
            const data = accSnap.docs[0].data();
            if (typeof data.balance === 'number') {
              setUser((prev) => ({
                ...prev,
                digitalBalance: data.balance,
              }));
            }
          }
        } catch {
          // Ignore transient network errors during background sync
        }
      }
      setLastBalanceSyncLabel(
        new Date().toLocaleTimeString('ar-SD', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };

    const timer = window.setInterval(refreshBalanceInBackground, syncIntervalMs);
    return () => window.clearInterval(timer);
  }, [isAuthenticated, isOffline, isPowerSavingEnabled, isLowBattery, syncIntervalMs]);

  // Sync offline queued transactions whenever connection returns
  const syncOfflineQueue = useCallback(async () => {
    const queuedItems = transactions.filter((t) => t.status === 'queued_offline');
    if (queuedItems.length === 0) return;

    setTransactions((prev) =>
      prev.map((tx) =>
        tx.status === 'queued_offline'
          ? { ...tx, status: 'completed', timestamp: 'تمت المزامنة الآن' }
          : tx
      )
    );
    localStorage.removeItem(OFFLINE_QUEUE_KEY);

    for (const qTx of queuedItems) {
      if (canPersistToFirestore() && auth.currentUser) {
        try {
          await updateDoc(doc(db, 'transfers', qTx.id), {
            status: 'completed',
          });
        } catch {
          // If it wasn't created online yet, create it cleanly
          try {
            await setDoc(doc(db, 'transfers', qTx.id), {
              senderUid: auth.currentUser.uid,
              senderName: user.fullName,
              senderAccount: user.accountNumber,
              receiverName: qTx.counterpartyName,
              receiverAccount: qTx.accountOrIban,
              receiverBankCode: qTx.bankCode,
              receiverBankName: qTx.counterpartyBank,
              channel: qTx.channel,
              routeType: qTx.routeType,
              amount: qTx.amount,
              fee: qTx.fee,
              reference: qTx.reference,
              faceVerified: qTx.biometricVerified,
              status: 'completed',
              createdAt: serverTimestamp(),
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `transfers/${qTx.id}`);
          }
        }
      }

      await logDispatch(
        'SMS',
        user.phone,
        'إتمام تحويل محفوظ بعد عودة الإنترنت',
        `تم تحويل مبلغ ${formatSdg(qTx.amount)} ج.س، الرصيد المتبقي ${formatSdg(
          user.digitalBalance
        )} ج.س`
      );
    }

    pushToast(
      'تمت مزامنة التحويلات المحفوظة',
      `تم إرسال ${queuedItems.length} عمليات معلقة تلقائياً فور عودة الاتصال بالإنترنت.`
    );
  }, [logDispatch, pushToast, transactions, user.accountNumber, user.digitalBalance, user.fullName, user.phone]);

  useEffect(() => {
    if (!isOffline) {
      const hasQueued = transactions.some((t) => t.status === 'queued_offline');
      if (hasQueued) {
        syncOfflineQueue();
      }
    }
  }, [isOffline, syncOfflineQueue, transactions]);

  const handleRecordFraud = async (reason: string) => {
    const alertId = `frd-${Date.now()}`;
    const newAlert: FraudAlertRecord = {
      id: alertId,
      citizenOrActor: user.fullName,
      reason,
      channel: 'الأمان البيومتري',
      timestamp: 'الآن',
    };
    setFraudAlerts((prev) => [newAlert, ...prev]);

    if (canPersistToFirestore() && auth.currentUser) {
      try {
        await setDoc(doc(db, 'fraudAlerts', alertId), {
          actorUid: auth.currentUser.uid,
          reason: reason.slice(0, 155),
          channel: 'الأمان البيومتري',
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `fraudAlerts/${alertId}`);
      }
    }
  };

  const handleLoginSuccess = async (
    newProfile?: BankUserProfile,
    deviceTransfer?: { deviceName: string; deviceId: string }
  ) => {
    if (newProfile) {
      setUser(newProfile);
      setRegisteredNationalIds((prev) =>
        prev.includes(newProfile.nationalId) ? prev : [...prev, newProfile.nationalId]
      );
      setRegisteredFaceHashes((prev) =>
        prev.includes(newProfile.faceVectorHash)
          ? prev
          : [...prev, newProfile.faceVectorHash]
      );
      setTotalRealAccounts((prev) => prev + 1);

      setTransactions([
        {
          id: `tx-${Date.now()}`,
          title: 'مكافأة افتتاح الحساب الرقمي - CBOS',
          counterpartyName: newProfile.fullName,
          counterpartyBank: 'بنك السودان المركزي - CBOS',
          bankCode: CBOS_BANK_CODE,
          accountOrIban: newProfile.iban,
          amount: newProfile.digitalBalance,
          fee: 0,
          type: 'credit',
          channel: 'IBAN',
          routeType: 'CBOS_INSTANT',
          timestamp: 'الآن · فوري',
          createdAtMs: Date.now(),
          reference: `CBOS-${Math.floor(100000 + Math.random() * 900000)}`,
          biometricVerified: true,
          status: 'completed',
        },
      ]);

      // Persist new citizen account + 512-D face registry entry (NO photo saved)
      if (canPersistToFirestore() && auth.currentUser) {
        const uid = auth.currentUser.uid;
        try {
          await setDoc(doc(db, 'accounts', uid), {
            uid,
            fullName: newProfile.fullName,
            nationalId: newProfile.nationalId,
            documentType: newProfile.documentType,
            phone: newProfile.phone,
            email: newProfile.email,
            accountNumber: newProfile.accountNumber,
            iban: newProfile.iban,
            balance: newProfile.digitalBalance,
            pinHash: newProfile.pinHash,
            faceVectorHash: newProfile.faceVectorHash,
            faceVectorLength: 512,
            boundDeviceId: newProfile.boundDeviceId,
            boundDeviceName: newProfile.boundDeviceName,
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          const faceKey = newProfile.faceVectorHash.replace(/[^a-zA-Z0-9_\-]/g, '');
          await setDoc(doc(db, 'faceRegistry', faceKey), {
            faceVectorHash: newProfile.faceVectorHash,
            nationalIdHash: `NID_${newProfile.nationalId}`,
            ownerUid: uid,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `accounts/${uid}`);
        }
      }

      await logDispatch(
        'EMAIL',
        newProfile.email,
        'مرحباً بك في بنك السودان المركزي - CBOS',
        `تم فتح حسابك البنكي بنجاح.\nالاسم: ${newProfile.fullName}\nرقم الحساب: ${newProfile.accountNumber}\nIBAN: ${newProfile.iban}`
      );
      pushToast(
        'تم فتح حسابك بنجاح',
        `تم إرسال رسالة الترحيب إلى ${newProfile.email} وتوليد IBAN الخاص بك.`
      );
    } else if (deviceTransfer) {
      await handleConfirmDeviceTransfer(deviceTransfer.deviceName, deviceTransfer.deviceId);
    }

    setActiveTab('home');
    setIsAuthenticated(true);
  };

  const handleConfirmDeviceTransfer = async (
    newDeviceName: string,
    newDeviceId: string
  ) => {
    setUser((prev) => ({
      ...prev,
      boundDeviceName: newDeviceName,
      boundDeviceId: newDeviceId,
      lastMigrationAt: 'تم النقل والتحقق بالوجه الآن',
    }));

    if (canPersistToFirestore() && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'accounts', auth.currentUser.uid), {
          boundDeviceId: newDeviceId,
          boundDeviceName: newDeviceName,
          updatedAt: serverTimestamp(),
        });
      } catch {
        // Ignore if account doc hasn't been persisted in preview session
      }
    }

    pushToast(
      'تم نقل الحساب إلى الهاتف الجديد',
      `تم التحقق ببصمة الوجه وتوثيق ${newDeviceName} (${newDeviceId}) وفصل الهاتف القديم.`
    );
  };

  const handleExecuteTransfer = async ({
    bank,
    accountOrIban,
    recipientName,
    amount,
    fee,
    channel,
    biometricVerified,
  }: {
    bank: SudaneseBank;
    accountOrIban: string;
    recipientName: string;
    amount: number;
    fee: number;
    channel: 'QR' | 'NFC' | 'IBAN';
    biometricVerified: boolean;
  }) => {
    const totalDeduct = amount + fee;
    const updatedBalance = Math.max(0, user.digitalBalance - totalDeduct);
    const routeType =
      bank.code === CBOS_BANK_CODE ? 'CBOS_INSTANT' : 'CENTRAL_BANK_SWITCH';
    const reference = `CBOS-${Math.floor(100000 + Math.random() * 900000)}`;
    const txId = `tx-${Date.now()}`;
    const status: BankTransaction['status'] = isOffline
      ? 'queued_offline'
      : 'completed';

    setUser((prev) => ({
      ...prev,
      digitalBalance: updatedBalance,
      usedToday: prev.usedToday + totalDeduct,
    }));

    const newTx: BankTransaction = {
      id: txId,
      title: `تحويل عبر ${channel} إلى ${recipientName}`,
      counterpartyName: recipientName,
      counterpartyBank: bank.nameAr,
      bankCode: bank.code,
      accountOrIban,
      amount,
      fee,
      type: 'debit',
      channel,
      routeType,
      timestamp: isOffline ? 'محفوظ (بدون إنترنت)' : 'الآن · فوري',
      createdAtMs: Date.now(),
      reference,
      biometricVerified,
      status,
    };

    setTransactions((prev) => {
      const next = [newTx, ...prev];
      if (isOffline) {
        const queue = next.filter((t) => t.status === 'queued_offline');
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      }
      return next;
    });

    if (isOffline) {
      pushToast(
        'تم حفظ التحويل لعدم توفر الإنترنت',
        `سيتم إرسال مبلغ ${formatSdg(amount)} ج.س إلى ${recipientName} تلقائياً عند عودة الاتصال.`
      );
      return;
    }

    if (canPersistToFirestore() && auth.currentUser) {
      const uid = auth.currentUser.uid;
      try {
        await setDoc(doc(db, 'transfers', txId), {
          senderUid: uid,
          senderName: user.fullName,
          senderAccount: user.accountNumber,
          receiverName: recipientName,
          receiverAccount: accountOrIban,
          receiverBankCode: bank.code,
          receiverBankName: bank.nameAr,
          channel,
          routeType,
          amount,
          fee,
          reference,
          faceVerified: biometricVerified,
          status: 'completed',
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `transfers/${txId}`);
      }
    }

    // Send SMS & full Email receipt
    const smsText = `تم تحويل مبلغ ${formatSdg(amount)} ج.س، الرصيد المتبقي ${formatSdg(
      updatedBalance
    )} ج.س`;
    const emailBody = `تفاصيل التحويل:\nالمرسل: ${user.fullName}\nالمستلم: ${recipientName}\nالبنك: ${
      bank.nameAr
    }\nالمبلغ: ${formatSdg(amount)} ج.س\nالرسوم: ${formatSdg(
      fee
    )} ج.س\nالتاريخ: ${new Date().toLocaleString('ar-SD')}\nالرقم المرجعي: ${reference}`;

    await logDispatch('SMS', user.phone, 'إشعار خصم وتحويل', smsText);
    await logDispatch(
      'EMAIL',
      user.email,
      `إيصال تحويل مصرفي - ${reference}`,
      emailBody
    );

    pushToast('تم تنفيذ التحويل وإرسال الإشعارات', smsText);
  };

  const handleExecuteDeposit = async (amount: number, source: string) => {
    const updatedBalance = user.digitalBalance + amount;
    setUser((prev) => ({
      ...prev,
      digitalBalance: updatedBalance,
    }));

    const newTx: BankTransaction = {
      id: `tx-${Date.now()}`,
      title: source,
      counterpartyName: user.fullName,
      counterpartyBank: 'بنك السودان المركزي - CBOS',
      bankCode: CBOS_BANK_CODE,
      accountOrIban: user.iban,
      amount,
      fee: 0,
      type: 'credit',
      channel: 'IBAN',
      routeType: 'CBOS_INSTANT',
      timestamp: 'الآن · إيداع فوري',
      createdAtMs: Date.now(),
      reference: `DEP-${Math.floor(100000 + Math.random() * 900000)}`,
      biometricVerified: false,
      status: 'completed',
    };

    setTransactions((prev) => [newTx, ...prev]);

    pushToast(
      'تم الإيداع وتحديث الرصيد بنجاح',
      `تمت إضافة ${formatSdg(amount)} ج.س · الرصيد الإجمالي الآن ${formatSdg(updatedBalance)} ج.س`
    );
  };

  const handlePayBill = async ({
    providerName,
    accountRef,
    amount,
  }: {
    providerName: string;
    accountRef: string;
    amount: number;
  }) => {
    const updatedBalance = Math.max(0, user.digitalBalance - amount);
    const reference = `BIL-${Math.floor(100000 + Math.random() * 900000)}`;
    const txId = `tx-${Date.now()}`;
    const status: BankTransaction['status'] = isOffline
      ? 'queued_offline'
      : 'completed';

    setUser((prev) => ({
      ...prev,
      digitalBalance: updatedBalance,
      usedToday: prev.usedToday + amount,
    }));

    const newTx: BankTransaction = {
      id: txId,
      title: `دفع فاتورة: ${providerName}`,
      counterpartyName: providerName,
      counterpartyBank: providerName,
      bankCode: 'BILL',
      accountOrIban: accountRef,
      amount,
      fee: 0,
      type: 'debit',
      channel: 'BILL',
      routeType: 'CENTRAL_BANK_SWITCH',
      timestamp: isOffline ? 'محفوظ (بدون إنترنت)' : 'الآن · سداد فوري',
      createdAtMs: Date.now(),
      reference,
      biometricVerified: false,
      status,
    };

    setTransactions((prev) => [newTx, ...prev]);

    if (!isOffline) {
      await logDispatch(
        'SMS',
        user.phone,
        'إشعار دفع فاتورة',
        `تم تحويل مبلغ ${formatSdg(amount)} ج.س، الرصيد المتبقي ${formatSdg(
          updatedBalance
        )} ج.س`
      );
    }

    pushToast(
      isOffline ? 'تم حفظ سداد الفاتورة محلياً' : 'تم سداد الفاتورة بنجاح',
      `تم خصم ${formatSdg(amount)} ج.س · الرصيد المتبقي ${formatSdg(updatedBalance)} ج.س`
    );
  };

  const handleGenerateCurrentStatement = async () => {
    const stmtId = `stmt-${Date.now()}`;
    const todayStr = new Date().toISOString().slice(0, 10);
    const newStmt: WeeklyStatement = {
      id: stmtId,
      weekLabel: `كشف الأسبوع التلقائي · الأحد 00:00 (${todayStr})`,
      periodStart: todayStr,
      periodEnd: todayStr,
      issuedAtLabel: `الأحد 00:00 · ${todayStr}`,
      issuedAtMs: Date.now(),
      openingBalance: user.digitalBalance,
      closingBalance: user.digitalBalance,
      transactionCount: transactions.length,
      transactions,
    };

    setStatements((prev) => [newStmt, ...prev]);

    if (canPersistToFirestore() && auth.currentUser) {
      try {
        await setDoc(doc(db, 'statements', stmtId), {
          ownerUid: auth.currentUser.uid,
          weekLabel: newStmt.weekLabel,
          periodStart: newStmt.periodStart,
          periodEnd: newStmt.periodEnd,
          openingBalance: newStmt.openingBalance,
          closingBalance: newStmt.closingBalance,
          transactionCount: newStmt.transactionCount,
          issuedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `statements/${stmtId}`);
      }
    }

    await logDispatch(
      'EMAIL',
      user.email,
      'كشف حسابك الأسبوعي PDF - بنك السودان المركزي CBOS',
      `تم إصدار كشف حسابك الأسبوعي المرفق بصيغة PDF برصيد ختامي ${formatSdg(
        user.digitalBalance
      )} ج.س لعدد ${transactions.length} معاملات.`
    );
    await logDispatch(
      'SMS',
      user.phone,
      'إصدار كشف الحساب الأسبوعي',
      'تم إصدار كشف حسابك الأسبوعي، اضغط هنا للتحميل'
    );

    pushToast(
      'تم إصدار كشف الحساب الأسبوعي PDF',
      'تم إرسال الملف إلى بريدك الإلكتروني وإرسال إشعار SMS بالتحميل.'
    );
  };

  const handleToggleCardFreeze = () => {
    setUser((prev) => ({
      ...prev,
      cardFrozen: !prev.cardFrozen,
    }));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      // Ignore if not signed into Firebase session
    }
    setIsAuthenticated(false);
    setIsTransferOpen(false);
    setIsQrOpen(false);
    setIsNfcOpen(false);
    setIsDepositOpen(false);
    setIsShadeOpen(false);
  };

  const queuedTransfersCount = transactions.filter(
    (t) => t.status === 'queued_offline'
  ).length;
  const remainingDailyLimit = Math.max(0, user.dailyLimit - user.usedToday);

  const navItems: { id: NavTab; label: string; icon: typeof Home }[] = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'account', label: 'حسابي البنكي', icon: Landmark },
    { id: 'statements', label: 'كشف الحساب', icon: FileSpreadsheet },
    { id: 'admin', label: 'لوحة المركزي', icon: ShieldCheck },
    { id: 'profile', label: 'الملف', icon: User },
  ];

  return (
    <>
      {!isAuthenticated ? (
        <AuthScreen
          existingNationalIds={registeredNationalIds}
          existingFaceHashes={registeredFaceHashes}
          currentBoundDeviceId={user.boundDeviceId}
          currentBoundDeviceName={user.boundDeviceName}
          storedPinHash={user.pinHash}
          onLoginSuccess={handleLoginSuccess}
          onDuplicateFaceFraud={handleRecordFraud}
          onOpenCbosAdmin={() => setIsPreAuthAdminOpen(true)}
        />
      ) : (
        <div className="min-h-screen bg-[#F4F7F5] dark:bg-[#06110D] flex flex-col transition-colors duration-200">
          {/* Top Navigation Bar */}
          <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0B1E17]/95 backdrop-blur-md border-b border-slate-200 dark:border-emerald-900/50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
              {/* Brand Title */}
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className="text-sm sm:text-base font-extrabold text-[#064E3B] dark:text-emerald-50 whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2.5"
              >
                <span className="w-8 h-8 rounded-lg cbos-gradient text-[#D4AF37] flex items-center justify-center shrink-0">
                  <Landmark className="w-4 h-4" />
                </span>
                <span>بنك السودان المركزي - CBOS</span>
              </button>

              {/* Desktop Navigation Links */}
              <nav
                aria-label="التنقل الرئيسي"
                className="hidden lg:flex items-center gap-5"
              >
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`min-h-[40px] px-1 text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                      activeTab === item.id
                        ? 'border-[#064E3B] dark:border-[#D4AF37] text-[#064E3B] dark:text-[#D4AF37]'
                        : 'border-transparent text-slate-600 dark:text-emerald-200/70 hover:text-[#064E3B] dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* Header Utility Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <PWAInstallButton compact />
                <button
                  type="button"
                  onClick={() => setIsOffline((p) => !p)}
                  title="تبديل وضع عدم الاتصال بالإنترنت"
                  className={`min-h-[38px] px-2.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    isOffline
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200'
                      : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-[#064E3B] dark:text-emerald-300'
                  }`}
                >
                  {isOffline ? (
                    <WifiOff className="w-3.5 h-3.5" />
                  ) : (
                    <Wifi className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">
                    {isOffline ? 'بدون إنترنت' : 'متصل'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsShadeOpen(true)}
                  aria-label="ستارة إشعارات الهاتف وأداة الرصيد"
                  title="ستارة الهاتف والاختصارات"
                  className="min-h-[40px] min-w-[40px] rounded-xl bg-slate-100 dark:bg-[#112A21] text-[#064E3B] dark:text-[#D4AF37] flex items-center justify-center cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsNotifLogOpen(true)}
                  aria-label="سجل SMS والبريد"
                  title="سجل SMS والبريد الإلكتروني"
                  className="min-h-[40px] min-w-[40px] rounded-xl bg-slate-100 dark:bg-[#112A21] text-[#064E3B] dark:text-[#D4AF37] flex items-center justify-center cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsTransferOpen(true)}
                  className="hidden md:inline-flex min-h-[40px] px-3.5 py-2 rounded-xl cbos-gradient text-white text-xs font-extrabold items-center gap-1.5 whitespace-nowrap shrink-0 hover:opacity-95 cursor-pointer"
                >
                  <ArrowUpRight className="w-4 h-4 text-[#D4AF37]" />
                  <span>تحويل</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="تسجيل الخروج"
                  className="lg:hidden min-h-[40px] min-w-[40px] rounded-xl bg-slate-100 dark:bg-[#112A21] text-slate-700 dark:text-emerald-100 flex items-center justify-center cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </header>

          {/* Main Workspace */}
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5 pb-28 lg:py-8">
            {activeTab === 'home' && (
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full cbos-gradient text-[#D4AF37] flex items-center justify-center font-extrabold text-sm shrink-0">
                    {user.initials}
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-extrabold text-[#0F1F18] dark:text-emerald-50">
                      مرحباً بك، {user.fullName.split(' ').slice(0, 2).join(' ')}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-emerald-200/70">
                      بصمة وجه موثقة {user.matchConfidence} · حساب واحد = وجه واحد
                    </div>
                  </div>
                </div>

                <div className="hidden lg:flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNotifLogOpen(true)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-emerald-900 bg-white dark:bg-[#0B1E17] text-xs font-bold text-[#064E3B] dark:text-[#D4AF37] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>رسائل SMS والبريد ({dispatchLogs.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-emerald-900 bg-white dark:bg-[#0B1E17] text-xs font-bold text-slate-700 dark:text-emerald-100 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'home' && (
              <HomeScreen
                user={user}
                transactions={transactions}
                isOffline={isOffline}
                queuedTransfersCount={queuedTransfersCount}
                onOpenQrTransfer={() => setIsQrOpen(true)}
                onOpenNfcTransfer={() => setIsNfcOpen(true)}
                onOpenTransfer={() => setIsTransferOpen(true)}
                onOpenPayBills={() => setIsBillsOpen(true)}
                onOpenDeposit={() => setIsDepositOpen(true)}
                onGoToAccount={() => setActiveTab('account')}
                onSyncOfflineQueue={syncOfflineQueue}
              />
            )}

            {activeTab === 'account' && (
              <AccountScreen
                user={user}
                onToggleCardFreeze={handleToggleCardFreeze}
                onOpenTransfer={() => setIsTransferOpen(true)}
              />
            )}

            {activeTab === 'statements' && (
              <StatementsScreen
                user={user}
                statements={statements}
                onGenerateCurrentStatement={handleGenerateCurrentStatement}
              />
            )}

            {activeTab === 'admin' && (
              <AdminDashboardScreen
                totalRealAccounts={totalRealAccounts}
                fraudAlerts={fraudAlerts}
                transactions={transactions}
                onSimulateFraudAttempt={() =>
                  handleRecordFraud(
                    'حظر محاولة فتح حساب ثانٍ — تطابق بصمة الوجه (512 رقماً) بنسبة 99.6%'
                  )
                }
              />
            )}

            {activeTab === 'profile' && (
              <ProfileScreen
                user={user}
                isDarkMode={isDarkMode}
                onToggleDarkMode={() => setIsDarkMode((p) => !p)}
                isPowerSavingEnabled={isPowerSavingEnabled}
                onTogglePowerSaving={togglePowerSaving}
                batteryLevel={batteryLevel}
                isCharging={isCharging}
                isLowBattery={isLowBattery}
                syncIntervalMs={syncIntervalMs}
                lastBalanceSyncLabel={lastBalanceSyncLabel}
                onOpenDeviceTransfer={() => setIsDeviceTransferOpen(true)}
                onOpenNotificationsLog={() => setIsNotifLogOpen(true)}
                onOpenAdmin={() => setActiveTab('admin')}
                onLogout={handleLogout}
              />
            )}
          </main>

          {/* Mobile Floating Green Capsule Bottom Tab Bar */}
          <nav
            aria-label="التنقل السفلي"
            className="lg:hidden fixed bottom-3 inset-x-3 mx-auto max-w-md z-40 rounded-full bg-gradient-to-r from-[#043624]/92 via-[#064E3B]/92 to-[#046C4E]/92 backdrop-blur-xl border border-emerald-200/25 shadow-[0_14px_34px_rgba(4,40,27,0.4)] p-1.5"
          >
            <div className="grid grid-cols-5 items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`min-h-[54px] px-1 py-1.5 rounded-full flex flex-col items-center justify-center gap-1 text-[10px] font-bold whitespace-nowrap cursor-pointer transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-b from-white/35 via-white/20 to-emerald-200/15 border border-white/55 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_4px_12px_rgba(0,0,0,0.18)] text-white font-extrabold'
                        : 'border border-transparent text-emerald-100/75 hover:text-white'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 ${
                        isActive ? 'stroke-[2.3] text-white' : 'stroke-[1.75]'
                      }`}
                    />
                    <span className="leading-none truncate max-w-full">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      )}

      {/* Pre-auth Central Bank Admin Preview Modal */}
      {isPreAuthAdminOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#041E15]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="لوحة إدارة بنك السودان المركزي"
        >
          <div className="w-full max-w-5xl bg-[#F4F7F5] dark:bg-[#06110D] rounded-3xl p-5 sm:p-7 max-h-[92vh] overflow-y-auto shadow-2xl border border-emerald-900/40">
            <div className="flex justify-end mb-3">
              <button
                type="button"
                onClick={() => setIsPreAuthAdminOpen(false)}
                aria-label="إغلاق"
                className="min-h-[44px] min-w-[44px] rounded-full bg-white dark:bg-[#0B1E17] border border-slate-200 dark:border-emerald-900 flex items-center justify-center text-slate-700 dark:text-emerald-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <AdminDashboardScreen
              totalRealAccounts={totalRealAccounts}
              fraudAlerts={fraudAlerts}
              transactions={transactions}
              onSimulateFraudAttempt={() =>
                handleRecordFraud(
                  'حظر محاولة فتح حساب ثانٍ — تطابق بصمة الوجه (512 رقماً) بنسبة 99.6%'
                )
              }
            />
          </div>
        </div>
      )}

      {/* Modals & Drawers */}
      <TransferModal
        isOpen={isTransferOpen}
        availableBalance={user.digitalBalance}
        remainingDailyLimit={remainingDailyLimit}
        isOffline={isOffline}
        onClose={() => setIsTransferOpen(false)}
        onExecuteTransfer={handleExecuteTransfer}
      />

      <QrTransferModal
        isOpen={isQrOpen}
        user={user}
        isOffline={isOffline}
        onClose={() => setIsQrOpen(false)}
        onExecuteTransfer={handleExecuteTransfer}
      />

      <NfcTransferModal
        isOpen={isNfcOpen}
        user={user}
        isOffline={isOffline}
        onClose={() => setIsNfcOpen(false)}
        onExecuteTransfer={handleExecuteTransfer}
      />

      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onExecuteDeposit={handleExecuteDeposit}
      />

      <PayBillsModal
        isOpen={isBillsOpen}
        availableBalance={user.digitalBalance}
        isOffline={isOffline}
        onClose={() => setIsBillsOpen(false)}
        onPayBill={handlePayBill}
      />

      <DeviceTransferModal
        isOpen={isDeviceTransferOpen}
        user={user}
        onClose={() => setIsDeviceTransferOpen(false)}
        onConfirmTransfer={handleConfirmDeviceTransfer}
      />

      <SystemShadeOverlay
        isOpen={isShadeOpen}
        user={user}
        lastTransaction={transactions[0]}
        isOffline={isOffline}
        onClose={() => setIsShadeOpen(false)}
        onQuickTransfer={() => setIsTransferOpen(true)}
        onQuickQr={() => setIsQrOpen(true)}
        onQuickNfc={() => setIsNfcOpen(true)}
        onOpenStatements={() => setActiveTab('statements')}
        onToggleOffline={() => setIsOffline((p) => !p)}
      />

      <NotificationsLogModal
        isOpen={isNotifLogOpen}
        logs={dispatchLogs}
        onClose={() => setIsNotifLogOpen(false)}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
