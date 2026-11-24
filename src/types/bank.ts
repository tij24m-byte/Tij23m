export type NavTab = 'home' | 'account' | 'statements' | 'admin' | 'profile';

export type AccountSubType = 'digital' | 'saving';

export type DocumentType = 'national_id' | 'passport';

export type TransferChannel = 'QR' | 'NFC' | 'IBAN' | 'OFFLINE_QUEUE' | 'BILL';

export type RouteType = 'CBOS_INSTANT' | 'CENTRAL_BANK_SWITCH';

export interface SudaneseBank {
  code: string;
  shortName: string;
  nameAr: string;
  swift: string;
  switchFee: number;
  expectedTime: string;
}

export interface BankTransaction {
  id: string;
  title: string;
  counterpartyName: string;
  counterpartyBank: string;
  bankCode: string;
  accountOrIban: string;
  amount: number;
  fee: number;
  type: 'debit' | 'credit';
  channel: TransferChannel;
  routeType: RouteType;
  timestamp: string;
  createdAtMs: number;
  reference: string;
  biometricVerified: boolean;
  status: 'completed' | 'queued_offline';
}

export interface BankUserProfile {
  uid: string;
  fullName: string;
  initials: string;
  nationalId: string;
  documentType: DocumentType;
  phone: string;
  email: string;
  accountNumber: string;
  iban: string;
  savingAccountNumber: string;
  savingIban: string;
  digitalBalance: number;
  savingBalance: number;
  dailyLimit: number;
  usedToday: number;
  pinHash: string;
  faceVectorHash: string;
  faceVector512Preview: number[];
  matchConfidence: string;
  cardFrozen: boolean;
  swiftCode: string;
  rejectedSpoofs: number;
  boundDeviceId: string;
  boundDeviceName: string;
  lastMigrationAt: string;
  isAdmin: boolean;
}

export interface WeeklyStatement {
  id: string;
  weekLabel: string;
  periodStart: string;
  periodEnd: string;
  issuedAtLabel: string;
  issuedAtMs: number;
  openingBalance: number;
  closingBalance: number;
  transactionCount: number;
  transactions: BankTransaction[];
}

export interface FraudAlertRecord {
  id: string;
  citizenOrActor: string;
  reason: string;
  channel: string;
  timestamp: string;
}

export interface DispatchNotification {
  id: string;
  kind: 'SMS' | 'EMAIL';
  recipient: string;
  subject: string;
  body: string;
  timestamp: string;
}

export interface QrPayloadData {
  type: 'CBOS_PAY';
  name: string;
  accountNumber: string;
  iban: string;
  bankCode: string;
  bankName: string;
}
