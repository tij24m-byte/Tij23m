import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Nfc,
  Plus,
  QrCode,
  Receipt,
  ScanFace,
  WifiOff,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BankTransaction, BankUserProfile } from '../types/bank';
import { BIOMETRIC_TRANSFER_THRESHOLD, formatSdg } from '../data/sudanBanks';

interface HomeScreenProps {
  user: BankUserProfile;
  transactions: BankTransaction[];
  isOffline: boolean;
  queuedTransfersCount: number;
  onOpenQrTransfer: () => void;
  onOpenNfcTransfer: () => void;
  onOpenTransfer: () => void;
  onOpenPayBills: () => void;
  onOpenDeposit: () => void;
  onGoToAccount: () => void;
  onSyncOfflineQueue: () => void;
}

const CHANNEL_LABELS: Record<BankTransaction['channel'], string> = {
  QR: 'QR',
  NFC: 'NFC',
  IBAN: 'تحويل بنكي',
  OFFLINE_QUEUE: 'بدون إنترنت',
  BILL: 'فاتورة',
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  transactions,
  isOffline,
  queuedTransfersCount,
  onOpenQrTransfer,
  onOpenNfcTransfer,
  onOpenTransfer,
  onOpenPayBills,
  onOpenDeposit,
  onGoToAccount,
  onSyncOfflineQueue,
}) => {
  const [hideBalance, setHideBalance] = useState(false);
  const [txFilter, setTxFilter] = useState<'all' | 'debit' | 'credit'>('all');

  const filteredTx = useMemo(
    () =>
      transactions.filter((tx) =>
        txFilter === 'all' ? true : tx.type === txFilter
      ),
    [transactions, txFilter]
  );

  const totalIncoming = useMemo(
    () =>
      transactions
        .filter((tx) => tx.type === 'credit')
        .reduce((sum, tx) => sum + tx.amount, 0),
    [transactions]
  );

  const totalOutgoing = useMemo(
    () =>
      transactions
        .filter((tx) => tx.type === 'debit')
        .reduce((sum, tx) => sum + tx.amount, 0),
    [transactions]
  );

  const incomingCount = useMemo(
    () => transactions.filter((tx) => tx.type === 'credit').length,
    [transactions]
  );

  const outgoingCount = useMemo(
    () => transactions.filter((tx) => tx.type === 'debit').length,
    [transactions]
  );

  const chartData = useMemo(() => {
    const todayExtraDebit = transactions
      .filter((tx) => tx.type === 'debit' && tx.timestamp.includes('الآن'))
      .reduce((sum, tx) => sum + tx.amount, 0);

    return [
      { day: 'الإثنين', transfers: 65000, spending: 24000 },
      { day: 'الثلاثاء', transfers: 110000, spending: 38000 },
      { day: 'الأربعاء', transfers: 45000, spending: 52000 },
      { day: 'الخميس', transfers: 185000, spending: 41000 },
      { day: 'الجمعة', transfers: 65000, spending: 29000 },
      { day: 'السبت', transfers: 95000, spending: 44000 },
      {
        day: 'الأحد',
        transfers: 85000 + todayExtraDebit,
        spending: 36000,
      },
    ];
  }, [transactions]);

  const remainingDailyLimit = Math.max(0, user.dailyLimit - user.usedToday);

  return (
    <div className="space-y-6">
      {/* Offline / Pending Sync Banner */}
      {(isOffline || queuedTransfersCount > 0) && (
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <WifiOff className="w-5 h-5 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-amber-900 dark:text-amber-100">
                {isOffline
                  ? 'وضع عدم الاتصال مفعّل حالياً'
                  : `يوجد ${queuedTransfersCount} تحويلات محفوظة بانتظار المزامنة`}
              </p>
              <p className="text-xs text-amber-800/85 dark:text-amber-200/80 mt-0.5">
                {isOffline
                  ? `يمكنك إجراء تحويلات QR وNFC الآن وسيرسلها النظام تلقائياً فور عودة الإنترنت (بانتظار الإرسال: ${queuedTransfersCount}).`
                  : 'انقر لإرسال التحويلات المحفوظة فوراً إلى المقاصة القومية.'}
              </p>
            </div>
          </div>

          {!isOffline && queuedTransfersCount > 0 && (
            <button
              type="button"
              onClick={onSyncOfflineQueue}
              className="min-h-[40px] px-4 rounded-xl bg-[#064E3B] text-white text-xs font-extrabold whitespace-nowrap shrink-0 cursor-pointer"
            >
              مزامنة وإرسال الآن
            </button>
          )}
        </div>
      )}

      {/* Top Hero Grid: Balance Card + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Main Sovereign Green & Gold Balance Card */}
        <section className="lg:col-span-7 cbos-gradient text-white rounded-3xl p-6 sm:p-7 shadow-lg shadow-[#064E3B]/20 flex flex-col justify-between border border-[#D4AF37]/30">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-semibold">
                الرصيد الإجمالي لحساب بنك السودان المركزي (ج.س)
              </p>
              <div className="mt-2 flex items-baseline gap-2.5 flex-wrap">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono-num tracking-tight whitespace-nowrap text-white">
                  {hideBalance ? '••••••••' : formatSdg(user.digitalBalance)}
                </span>
                <span className="text-sm font-bold text-[#D4AF37] whitespace-nowrap">
                  ج.س
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setHideBalance((prev) => !prev)}
              aria-label={hideBalance ? 'إظهار الرصيد' : 'إخفاء الرصيد'}
              className="min-h-[44px] min-w-[44px] rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              {hideBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-white/15 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="block text-emerald-100/75 mb-0.5">البصمة الرقمية للوجه</span>
              <span className="font-bold text-[#D4AF37] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>موثقة بـ 512 رقماً · {user.matchConfidence}</span>
              </span>
            </div>
            <div>
              <span className="block text-emerald-100/75 mb-0.5">الحد اليومي المتاح</span>
              <span className="font-bold font-mono-num text-white whitespace-nowrap">
                {formatSdg(remainingDailyLimit)} ج.س
              </span>
            </div>
          </div>
        </section>

        {/* Quick Actions Grid (QR, NFC, Transfer, Bills, Deposit) */}
        <section className="lg:col-span-5 flex flex-col justify-between gap-3.5">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onOpenQrTransfer}
              className="min-h-[58px] rounded-2xl cbos-gradient text-white px-3 py-3 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer border border-[#D4AF37]/40"
            >
              <QrCode className="w-5 h-5 text-[#D4AF37] shrink-0" />
              <span>تحويل عبر QR</span>
            </button>

            <button
              type="button"
              onClick={onOpenNfcTransfer}
              className="min-h-[58px] rounded-2xl cbos-gradient text-white px-3 py-3 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer border border-[#D4AF37]/40"
            >
              <Nfc className="w-5 h-5 text-[#D4AF37] shrink-0" />
              <span>تحويل عبر NFC</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={onOpenTransfer}
              className="min-h-[54px] rounded-2xl bg-white dark:bg-[#0B1E17] border border-slate-200 dark:border-emerald-900/60 text-[#064E3B] dark:text-[#D4AF37] px-2 py-2.5 text-xs font-extrabold flex flex-col items-center justify-center gap-1 hover:border-[#064E3B] cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>تحويل</span>
            </button>

            <button
              type="button"
              onClick={onOpenPayBills}
              className="min-h-[54px] rounded-2xl bg-white dark:bg-[#0B1E17] border border-slate-200 dark:border-emerald-900/60 text-[#064E3B] dark:text-[#D4AF37] px-2 py-2.5 text-xs font-extrabold flex flex-col items-center justify-center gap-1 hover:border-[#064E3B] cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>دفع فواتير</span>
            </button>

            <button
              type="button"
              onClick={onOpenDeposit}
              className="min-h-[54px] rounded-2xl bg-white dark:bg-[#0B1E17] border border-slate-200 dark:border-emerald-900/60 text-[#064E3B] dark:text-[#D4AF37] px-2 py-2.5 text-xs font-extrabold flex flex-col items-center justify-center gap-1 hover:border-[#064E3B] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إيداع</span>
            </button>
          </div>

          <div className="bg-white dark:bg-[#0B1E17] rounded-2xl border border-slate-200 dark:border-emerald-900/50 p-3.5 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h2 className="text-xs sm:text-sm font-extrabold text-[#0F1F18] dark:text-emerald-50">
                حماية التحويلات الكبيرة ومكافحة السرقة
              </h2>
              <p className="text-[11px] text-slate-600 dark:text-emerald-200/75">
                أي تحويل يتجاوز{' '}
                <span className="font-mono-num font-bold text-[#064E3B] dark:text-[#D4AF37] whitespace-nowrap">
                  {formatSdg(BIOMETRIC_TRANSFER_THRESHOLD)} ج.س
                </span>{' '}
                يتطلب التحقق الحي ببصمة الوجه.
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-[#064E3B] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
              <ScanFace className="w-5 h-5" />
            </div>
          </div>

          <button
            type="button"
            onClick={onGoToAccount}
            className="w-full min-h-[44px] rounded-2xl bg-slate-100 dark:bg-[#112A21] hover:bg-slate-200/70 dark:hover:bg-[#16362b] px-4 py-2 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-emerald-100 transition-colors cursor-pointer"
          >
            <span>رقم الحساب الدولي (IBAN)</span>
            <span dir="ltr" className="font-mono-num text-[#064E3B] dark:text-[#D4AF37]">
              {user.iban}
            </span>
          </button>
        </section>
      </div>

      {/* 7-Day Spending & Transfers Analytics Chart */}
      <section className="bg-white dark:bg-[#0B1E17] rounded-3xl border border-slate-200 dark:border-emerald-900/50 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-extrabold text-[#0F1F18] dark:text-emerald-50">
              اتجاهات الإنفاق والتحويلات خلال الأيام السبعة الماضية
            </h2>
            <p className="text-xs text-slate-500 dark:text-emerald-200/70 mt-0.5">
              مقارنة يومية لحجم التحويلات الصادرة والإنفاق بالجنيه السوداني
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-[#047857] dark:text-emerald-300">
              <span className="w-2.5 h-2.5 rounded-full bg-[#047857]" />
              <span>التحويلات</span>
            </span>
            <span className="flex items-center gap-1.5 text-[#B48A1E] dark:text-[#D4AF37]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
              <span>الإنفاق والفواتير</span>
            </span>
          </div>
        </div>

        <div className="h-56 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.18} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `${Math.round(v / 1000)}K`}
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip
                formatter={(value) => `${formatSdg(Number(value))} ج.س`}
                contentStyle={{
                  borderRadius: '14px',
                  borderColor: '#064E3B',
                  backgroundColor: '#04281B',
                  color: '#ECFDF5',
                  fontSize: '12px',
                  direction: 'rtl',
                }}
              />
              <Line
                type="monotone"
                dataKey="transfers"
                name="التحويلات"
                stroke="#047857"
                strokeWidth={3}
                dot={{ r: 3.5, fill: '#047857' }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="spending"
                name="الإنفاق"
                stroke="#D4AF37"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#D4AF37' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* All Incoming & Outgoing Transactions */}
      <section className="bg-white dark:bg-[#0B1E17] rounded-3xl border border-slate-200 dark:border-emerald-900/50 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#0F1F18] dark:text-emerald-50">
              سجل المعاملات الواردة والمرسلة
            </h2>
            <p className="text-xs text-slate-500 dark:text-emerald-200/70 mt-0.5">
              التحويلات الفورية داخل CBOS وعبر المقاصة القومية ({transactions.length})
            </p>
          </div>

          <div
            role="tablist"
            aria-label="تصفية المعاملات"
            className="inline-flex p-1 bg-slate-100 dark:bg-[#112A21] rounded-xl self-start sm:self-auto"
          >
            {[
              { id: 'all', label: `الكل (${transactions.length})` },
              { id: 'credit', label: `الواردة (${incomingCount})` },
              { id: 'debit', label: `المرسلة (${outgoingCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={txFilter === tab.id}
                onClick={() => setTxFilter(tab.id as 'all' | 'debit' | 'credit')}
                className={`min-h-[38px] px-3 sm:px-3.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  txFilter === tab.id
                    ? 'bg-white dark:bg-[#064E3B] text-[#064E3B] dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-emerald-200/70 hover:text-[#064E3B] dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Incoming vs Outgoing Totals Strip */}
        <div className="grid grid-cols-2 gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-emerald-900/40">
          <div className="rounded-2xl bg-slate-50 dark:bg-[#112A21] px-3.5 py-3">
            <span className="block text-[11px] font-semibold text-slate-500 dark:text-emerald-200/70">
              إجمالي المعاملات الواردة
            </span>
            <span
              dir="ltr"
              className="block font-mono-num text-sm sm:text-base font-extrabold text-emerald-700 dark:text-emerald-400 mt-1 text-right whitespace-nowrap"
            >
              + {formatSdg(totalIncoming)} ج.س
            </span>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-[#112A21] px-3.5 py-3">
            <span className="block text-[11px] font-semibold text-slate-500 dark:text-emerald-200/70">
              إجمالي المعاملات المرسلة
            </span>
            <span
              dir="ltr"
              className="block font-mono-num text-sm sm:text-base font-extrabold text-[#064E3B] dark:text-[#D4AF37] mt-1 text-right whitespace-nowrap"
            >
              - {formatSdg(totalOutgoing)} ج.س
            </span>
          </div>
        </div>

        {filteredTx.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500 dark:text-emerald-200/70">
            لا توجد معاملات مطابقة للتصفية الحالية.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-emerald-900/40">
            {filteredTx.map((tx) => (
              <div
                key={tx.id}
                className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === 'credit'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-[#112A21] text-[#064E3B] dark:text-[#D4AF37]'
                    }`}
                  >
                    {tx.type === 'credit' ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#0F1F18] dark:text-emerald-50 truncate">
                      {tx.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-emerald-200/70 flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span
                        className={`font-bold ${
                          tx.type === 'credit'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-[#064E3B] dark:text-[#D4AF37]'
                        }`}
                      >
                        {tx.type === 'credit' ? 'وارد' : 'مرسل'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{CHANNEL_LABELS[tx.channel]}</span>
                      <span aria-hidden="true">·</span>
                      <span dir="ltr" className="font-mono-num">
                        {tx.accountOrIban}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{tx.timestamp}</span>
                      {tx.status === 'queued_offline' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-700 dark:text-amber-300 font-bold">
                            بانتظار الإنترنت
                          </span>
                        </>
                      )}
                      {tx.biometricVerified && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                            موثق بالوجه
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <div
                    dir="ltr"
                    className={`text-sm font-extrabold font-mono-num whitespace-nowrap ${
                      tx.type === 'credit'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-[#0F1F18] dark:text-emerald-50'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'} {formatSdg(tx.amount)}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-emerald-200/60 font-mono-num">
                    {tx.reference}
                    {tx.fee > 0 ? ` · رسوم ${tx.fee}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
