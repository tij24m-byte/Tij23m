import {
  BankTransaction,
  BankUserProfile,
  DispatchNotification,
  FraudAlertRecord,
  SudaneseBank,
  WeeklyStatement,
} from '../types/bank';

export const BIOMETRIC_TRANSFER_THRESHOLD = 200000;
export const CBOS_BANK_CODE = '0000';
export const CBOS_BANK_NAME = 'بنك السودان المركزي - CBOS';
export const SWITCH_FEE_SDG = 150;

export const SUDANESE_BANKS: SudaneseBank[] = [
  {
    code: '0000',
    shortName: 'CBOS',
    nameAr: 'بنك السودان المركزي - CBOS',
    swift: 'CBOSKSDH',
    switchFee: 0,
    expectedTime: 'فوري (ثانية واحدة)',
  },
  {
    code: '0001',
    shortName: 'BOK',
    nameAr: 'بنك الخرطوم',
    swift: 'BOKHSDKH',
    switchFee: 150,
    expectedTime: 'خلال 15 ثانية - دقيقتين (المقاصة القومية)',
  },
  {
    code: '0002',
    shortName: 'FIB',
    nameAr: 'بنك فيصل الإسلامي السوداني',
    swift: 'FISBSDKH',
    switchFee: 150,
    expectedTime: 'خلال 15 ثانية - دقيقتين (المقاصة القومية)',
  },
  {
    code: '0003',
    shortName: 'ONB',
    nameAr: 'بنك أم درمان الوطني',
    swift: 'ONBKSKDH',
    switchFee: 150,
    expectedTime: 'خلال 15 ثانية - دقيقتين (المقاصة القومية)',
  },
  {
    code: '0004',
    shortName: 'SFB',
    nameAr: 'البنك السوداني الفرنسي',
    swift: 'SUFRSDKH',
    switchFee: 150,
    expectedTime: 'خلال 30 ثانية - 3 دقائق (المقاصة القومية)',
  },
  {
    code: '0005',
    shortName: 'ENB',
    nameAr: 'بنك النيلين',
    swift: 'NILBSDKH',
    switchFee: 150,
    expectedTime: 'خلال 30 ثانية - 3 دقائق (المقاصة القومية)',
  },
  {
    code: '0006',
    shortName: 'ABK',
    nameAr: 'بنك البركة السوداني',
    swift: 'BRKASDKH',
    switchFee: 150,
    expectedTime: 'خلال 30 ثانية - 3 دقائق (المقاصة القومية)',
  },
  {
    code: '0010',
    shortName: 'ASB',
    nameAr: 'بنك السلام السودان',
    swift: 'ALSLSDKH',
    switchFee: 150,
    expectedTime: 'خلال 15 ثانية - دقيقتين (المقاصة القومية)',
  },
];

export function generate512FaceVector(): number[] {
  const vec: number[] = [];
  for (let i = 0; i < 512; i++) {
    vec.push(Number(((Math.sin(i * 12.9898 + Math.random()) * 0.5) + 0.5).toFixed(4)));
  }
  return vec;
}

export function hashPin(pin: string): string {
  let acc = 2166136261;
  for (let i = 0; i < pin.length; i++) {
    acc ^= pin.charCodeAt(i);
    acc = Math.imul(acc, 16777619);
  }
  return `PIN#${(acc >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
}

export const DEFAULT_USER_PROFILE: BankUserProfile = {
  uid: 'demo-cbos-citizen-001',
  fullName: 'أحمد محمد عثمان إبراهيم',
  initials: 'أ م',
  nationalId: '10987654321',
  documentType: 'national_id',
  phone: '+249912345678',
  email: 'ahmed.osman@cbos.sd',
  accountNumber: '001849208812',
  iban: 'SD94 0000 0018 4920 8812',
  savingAccountNumber: '001877310490',
  savingIban: 'SD94 0000 0018 7731 0490',
  digitalBalance: 1450000,
  savingBalance: 685000,
  dailyLimit: 5000000,
  usedToday: 85000,
  pinHash: hashPin('1234'),
  faceVectorHash: 'VEC#9F82A1C408D24E',
  faceVector512Preview: generate512FaceVector(),
  matchConfidence: '99.8%',
  cardFrozen: false,
  swiftCode: 'CBOSKSDH',
  rejectedSpoofs: 1,
  boundDeviceId: 'SD-DEV-8914-KRT',
  boundDeviceName: 'الهاتف الموثق الأساسي',
  lastMigrationAt: 'مرتبط منذ فتح الحساب',
  isAdmin: true,
};

export const INITIAL_TRANSACTIONS: BankTransaction[] = [
  {
    id: 'tx-101',
    title: 'تحويل إلى بنك الخرطوم',
    counterpartyName: 'شركة النيل للتجارة',
    counterpartyBank: 'بنك الخرطوم',
    bankCode: '0001',
    accountOrIban: 'SD04 0001 0045 8821',
    amount: 85000,
    fee: 150,
    type: 'debit',
    channel: 'IBAN',
    routeType: 'CENTRAL_BANK_SWITCH',
    timestamp: 'اليوم · 10:42 صباحاً',
    createdAtMs: Date.now() - 1000 * 60 * 140,
    reference: 'CBOS-884120',
    biometricVerified: false,
    status: 'completed',
  },
  {
    id: 'tx-102',
    title: 'حوالة واردة من بنك فيصل الإسلامي',
    counterpartyName: 'سارة الطيب عبد الله',
    counterpartyBank: 'بنك فيصل الإسلامي السوداني',
    bankCode: '0002',
    accountOrIban: 'SD04 0002 9910 3412',
    amount: 320000,
    fee: 0,
    type: 'credit',
    channel: 'QR',
    routeType: 'CENTRAL_BANK_SWITCH',
    timestamp: 'أمس · 03:18 مساءً',
    createdAtMs: Date.now() - 1000 * 60 * 60 * 24,
    reference: 'CBOS-883904',
    biometricVerified: true,
    status: 'completed',
  },
  {
    id: 'tx-103',
    title: 'تحويل فوري عبر QR (CBOS)',
    counterpartyName: 'خالد دفع الله محمد',
    counterpartyBank: 'بنك السودان المركزي - CBOS',
    bankCode: '0000',
    accountOrIban: 'SD94 0000 0018 3319 6044',
    amount: 65000,
    fee: 0,
    type: 'debit',
    channel: 'QR',
    routeType: 'CBOS_INSTANT',
    timestamp: 'الجمعة · 01:05 مساءً',
    createdAtMs: Date.now() - 1000 * 60 * 60 * 50,
    reference: 'CBOS-882411',
    biometricVerified: true,
    status: 'completed',
  },
  {
    id: 'tx-104',
    title: 'إيداع تسوية تجارية من بنك السلام',
    counterpartyName: 'مؤسسة الجزيرة الزراعية',
    counterpartyBank: 'بنك السلام السودان',
    bankCode: '0010',
    accountOrIban: 'SD04 0010 5201 7743',
    amount: 510000,
    fee: 0,
    type: 'credit',
    channel: 'IBAN',
    routeType: 'CENTRAL_BANK_SWITCH',
    timestamp: '10 نوفمبر · 09:20 صباحاً',
    createdAtMs: Date.now() - 1000 * 60 * 60 * 110,
    reference: 'CBOS-881092',
    biometricVerified: true,
    status: 'completed',
  },
];

export const INITIAL_WEEKLY_STATEMENTS: WeeklyStatement[] = [
  {
    id: 'stmt-2026-w46',
    weekLabel: 'الأسبوع الجاري · الأحد 15 نوفمبر 2026 (00:00)',
    periodStart: '2026-11-08',
    periodEnd: '2026-11-15',
    issuedAtLabel: 'الأحد 15 نوفمبر 2026 · 00:00',
    issuedAtMs: Date.now() - 1000 * 60 * 60 * 4,
    openingBalance: 1120000,
    closingBalance: 1450000,
    transactionCount: 4,
    transactions: INITIAL_TRANSACTIONS,
  },
  {
    id: 'stmt-2026-w45',
    weekLabel: 'الأسبوع السابق · الأحد 08 نوفمبر 2026 (00:00)',
    periodStart: '2026-11-01',
    periodEnd: '2026-11-08',
    issuedAtLabel: 'الأحد 08 نوفمبر 2026 · 00:00',
    issuedAtMs: Date.now() - 1000 * 60 * 60 * 24 * 7,
    openingBalance: 980000,
    closingBalance: 1120000,
    transactionCount: 2,
    transactions: INITIAL_TRANSACTIONS.slice(2),
  },
];

export const INITIAL_FRAUD_ALERTS: FraudAlertRecord[] = [
  {
    id: 'frd-1',
    citizenOrActor: 'محاولة فتح حساب ثانٍ (الرقم الوطني 1098••••321)',
    reason: 'تطابق البصمة الرقمية للوجه 512-D مع حساب قائم مسبقاً',
    channel: 'التسجيل الموحد',
    timestamp: 'اليوم · 09:14 صباحاً',
  },
  {
    id: 'frd-2',
    citizenOrActor: 'جهاز غير موثق (محاولة تحويل من هاتف مفقود)',
    reason: 'فشل مطابقة الوجه الحي (نسبة التطابق 41.2% أقل من 99%)',
    channel: 'حماية السرقة',
    timestamp: 'أمس · 08:40 مساءً',
  },
];

export const INITIAL_DISPATCH_LOGS: DispatchNotification[] = [
  {
    id: 'dsp-1',
    kind: 'SMS',
    recipient: '+249912345678',
    subject: 'إصدار كشف الحساب الأسبوعي',
    body: 'تم إصدار كشف حسابك الأسبوعي، اضغط هنا للتحميل',
    timestamp: 'الأحد 00:00',
  },
  {
    id: 'dsp-2',
    kind: 'EMAIL',
    recipient: 'ahmed.osman@cbos.sd',
    subject: 'كشف حسابك الأسبوعي - بنك السودان المركزي CBOS',
    body: 'تم إرفاق ملف PDF لكشف الحساب الأسبوعي حتى تاريخ 2026-11-15 برصيد ختامي 1,450,000.00 ج.س.',
    timestamp: 'الأحد 00:00',
  },
];

export function formatSdg(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatIbanDisplay(raw: string): string {
  const cleaned = raw.replace(/\s+/g, '').toUpperCase();
  return cleaned.match(/.{1,4}/g)?.join(' ') ?? cleaned;
}

export function generateAccountNumber(): string {
  const seg1 = Math.floor(1000 + Math.random() * 9000);
  const seg2 = Math.floor(1000 + Math.random() * 9000);
  return `0018${seg1}${seg2}`;
}

export function generateSudaneseIban(bankCode = '0000', accountNum?: string): string {
  const check = Math.floor(10 + Math.random() * 89);
  const acc = accountNum || generateAccountNumber();
  return formatIbanDisplay(`SD${check}${bankCode}${acc}`);
}

export function generateBiometricVectorHash(): string {
  const chars = '0123456789ABCDEF';
  let hash = 'VEC#';
  for (let i = 0; i < 14; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export function generateDeviceId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const suffix =
    chars[Math.floor(Math.random() * chars.length)] +
    chars[Math.floor(Math.random() * chars.length)] +
    chars[Math.floor(Math.random() * chars.length)];
  return `SD-DEV-${num}-${suffix}`;
}

export function normalizeSudanPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('249')) {
    return `+249${digits.slice(3, 12)}`;
  }
  if (digits.startsWith('0')) {
    return `+249${digits.slice(1, 10)}`;
  }
  return `+249${digits.slice(0, 9)}`;
}
