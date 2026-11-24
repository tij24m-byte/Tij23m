import React, { useState } from 'react';
import {
  AlertOctagon,
  ArrowLeftRight,
  Building2,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { BankTransaction, FraudAlertRecord } from '../types/bank';
import { CBOS_BANK_CODE, formatSdg } from '../data/sudanBanks';

interface AdminDashboardScreenProps {
  totalRealAccounts: number;
  fraudAlerts: FraudAlertRecord[];
  transactions: BankTransaction[];
  onSimulateFraudAttempt: () => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  totalRealAccounts,
  fraudAlerts,
  transactions,
  onSimulateFraudAttempt,
}) => {
  const [simNotice, setSimNotice] = useState(false);

  const interbankTransfers = transactions.filter(
    (tx) => tx.bankCode !== CBOS_BANK_CODE
  );
  const interbankVolume = interbankTransfers.reduce(
    (sum, tx) => sum + tx.amount,
    0
  );

  const handleTestFraud = () => {
    onSimulateFraudAttempt();
    setSimNotice(true);
    setTimeout(() => setSimNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F1F18] dark:text-emerald-50">
            لوحة إدارة بنك السودان المركزي - CBOS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-emerald-200/70 mt-0.5">
            مراقبة الحسابات الموثقة، محاولات الاحتيال المحجوبة، وحركة المقاصة بين البنوك السودانية
          </p>
        </div>

        <button
          type="button"
          onClick={handleTestFraud}
          className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#D4AF37] text-[#04281B] text-xs font-extrabold hover:opacity-95 whitespace-nowrap shrink-0 cursor-pointer"
        >
          محاكاة محاولة احتيال / وجه مكرر
        </button>
      </div>

      {simNotice && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-3.5 flex items-center gap-2.5 text-xs font-bold text-red-700 dark:text-red-300">
          <AlertOctagon className="w-4 h-4 shrink-0" />
          <span>
            تم رصد وحجب محاولة تسجيل مكررة بالبصمة الرقمية للوجه وتوثيقها في سجل الرقابة المركزي.
          </span>
        </div>
      )}

      {/* 3 Primary Admin KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0B1E17] rounded-3xl border border-slate-200 dark:border-emerald-900/50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-emerald-200/70">
              إجمالي الحسابات الحقيقية الموثقة
            </span>
            <Users className="w-5 h-5 text-[#064E3B] dark:text-[#D4AF37]" />
          </div>
          <div className="font-mono-num text-3xl font-extrabold text-[#064E3B] dark:text-emerald-300 mt-3">
            {totalRealAccounts}
          </div>
          <div className="text-xs text-slate-500 dark:text-emerald-200/70 mt-1">
            حساب واحد = بصمة وجه واحدة (512 رقماً)
          </div>
        </div>

        <div className="bg-white dark:bg-[#0B1E17] rounded-3xl border border-slate-200 dark:border-emerald-900/50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-emerald-200/70">
              محاولات الاحتيال المحجوبة
            </span>
            <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="font-mono-num text-3xl font-extrabold text-red-700 dark:text-red-400 mt-3">
            {fraudAlerts.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-emerald-200/70 mt-1">
            رفض فوري للوجوه المكررة والهواتف المفقودة
          </div>
        </div>

        <div className="bg-white dark:bg-[#0B1E17] rounded-3xl border border-slate-200 dark:border-emerald-900/50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-emerald-200/70">
              التحويلات بين البنوك (المقاصة القومية)
            </span>
            <ArrowLeftRight className="w-5 h-5 text-[#B48A1E] dark:text-[#D4AF37]" />
          </div>
          <div dir="ltr" className="font-mono-num text-2xl font-extrabold text-[#0F1F18] dark:text-emerald-50 mt-3 text-right">
            {formatSdg(interbankVolume)} <span className="text-xs">ج.س</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-emerald-200/70 mt-1">
            عدد العمليات بين المصارف: {interbankTransfers.length}
          </div>
        </div>
      </div>

      {/* Two-Column Oversight Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Blocked Fraud Attempts */}
        <section className="bg-white dark:bg-[#0B1E17] rounded-3xl border border-slate-200 dark:border-emerald-900/50 p-5 sm:p-6">
          <h2 className="text-base font-extrabold text-[#0F1F18] dark:text-emerald-50 mb-4">
            سجل محاولات الاحتيال المحجوبة
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-emerald-900/40">
            {fraudAlerts.map((alert) => (
              <div key={alert.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-red-700 dark:text-red-400">
                    {alert.citizenOrActor}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-emerald-200/60">
                    {alert.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-emerald-200/80">
                  {alert.reason} · {alert.channel}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Interbank Transfers via Switch */}
        <section className="bg-white dark:bg-[#0B1E17] rounded-3xl border border-slate-200 dark:border-emerald-900/50 p-5 sm:p-6">
          <h2 className="text-base font-extrabold text-[#0F1F18] dark:text-emerald-50 mb-4">
            حركة المقاصة بين البنوك السودانية
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-emerald-900/40">
            {interbankTransfers.map((tx) => (
              <div
                key={tx.id}
                className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-[#064E3B] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#0F1F18] dark:text-emerald-50 truncate">
                      {tx.counterpartyBank}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-emerald-200/70 font-mono-num">
                      {tx.channel} · {tx.reference}
                    </div>
                  </div>
                </div>
                <div dir="ltr" className="font-mono-num text-sm font-extrabold text-[#0F1F18] dark:text-emerald-50 whitespace-nowrap">
                  {formatSdg(tx.amount)} SDG
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
