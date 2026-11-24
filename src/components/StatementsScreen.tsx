import React from 'react';
import { CalendarClock, Download, FileText, Mail, MessageSquare } from 'lucide-react';
import { BankUserProfile, WeeklyStatement } from '../types/bank';
import { formatSdg } from '../data/sudanBanks';
import { downloadWeeklyStatementPdf } from '../utils/pdfStatement';

interface StatementsScreenProps {
  user: BankUserProfile;
  statements: WeeklyStatement[];
  onGenerateCurrentStatement: () => void;
}

export const StatementsScreen: React.FC<StatementsScreenProps> = ({
  user,
  statements,
  onGenerateCurrentStatement,
}) => {
  const sortedStatements = [...statements].sort(
    (a, b) => b.issuedAtMs - a.issuedAtMs
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F1F18] dark:text-emerald-50">
            كشف الحساب
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-emerald-200/70 mt-0.5">
            يُصدر تلقائياً كل يوم أحد الساعة 00:00 بصيغة PDF ويرسل إلى بريدك الإلكتروني مع إشعار SMS
          </p>
        </div>

        <button
          type="button"
          onClick={onGenerateCurrentStatement}
          className="min-h-[44px] px-4 py-2.5 rounded-2xl cbos-gradient text-white text-xs font-extrabold flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer hover:opacity-95"
        >
          <CalendarClock className="w-4 h-4 text-[#D4AF37]" />
          <span>إصدار كشف الأسبوع الحالي الآن</span>
        </button>
      </div>

      {/* Automatic Sunday Schedule Summary */}
      <div className="bg-white dark:bg-[#0B1E17] rounded-3xl border border-slate-200 dark:border-emerald-900/50 p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-start gap-3">
          <CalendarClock className="w-5 h-5 text-[#064E3B] dark:text-[#D4AF37] shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-extrabold text-[#0F1F18] dark:text-emerald-50">
              الجدولة التلقائية
            </div>
            <div className="text-xs text-slate-500 dark:text-emerald-200/70 mt-0.5">
              كل يوم أحد · الساعة 00:00 منتصف الليل
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-[#064E3B] dark:text-[#D4AF37] shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-extrabold text-[#0F1F18] dark:text-emerald-50">
              الإرسال للبريد الإلكتروني
            </div>
            <div dir="ltr" className="text-xs font-mono-num text-slate-500 dark:text-emerald-200/70 mt-0.5 text-right">
              {user.email}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-[#064E3B] dark:text-[#D4AF37] shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-extrabold text-[#0F1F18] dark:text-emerald-50">
              رسالة التنبيه النصية (SMS)
            </div>
            <div className="text-xs text-slate-500 dark:text-emerald-200/70 mt-0.5">
              &ldquo;تم إصدار كشف حسابك الأسبوعي، اضغط هنا للتحميل&rdquo;
            </div>
          </div>
        </div>
      </div>

      {/* Sorted PDF Statements List */}
      <div className="bg-white dark:bg-[#0B1E17] rounded-3xl border border-slate-200 dark:border-emerald-900/50 divide-y divide-slate-100 dark:divide-emerald-900/40">
        {sortedStatements.map((stmt) => (
          <div
            key={stmt.id}
            className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#064E3B] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-[#0F1F18] dark:text-emerald-50">
                  {stmt.weekLabel}
                </h2>
                <div className="text-xs text-slate-500 dark:text-emerald-200/70 flex flex-wrap items-center gap-2 mt-1">
                  <span>الفترة: {stmt.periodStart} إلى {stmt.periodEnd}</span>
                  <span aria-hidden="true">·</span>
                  <span>المعاملات: {stmt.transactionCount}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-num font-bold text-[#064E3B] dark:text-emerald-300">
                    الرصيد الختامي: {formatSdg(stmt.closingBalance)} ج.س
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => downloadWeeklyStatementPdf(stmt, user)}
              className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[#064E3B] dark:border-[#D4AF37] text-[#064E3B] dark:text-[#D4AF37] hover:bg-[#064E3B] hover:text-white dark:hover:bg-[#D4AF37] dark:hover:text-[#04281B] text-xs font-extrabold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تحميل PDF</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
