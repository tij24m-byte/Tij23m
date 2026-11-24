import React, { useState } from 'react';
import { ArrowUpRight, Check, Copy, Lock, Unlock, Wifi } from 'lucide-react';
import { AccountSubType, BankUserProfile } from '../types/bank';
import { formatSdg } from '../data/sudanBanks';

interface AccountScreenProps {
  user: BankUserProfile;
  onToggleCardFreeze: () => void;
  onOpenTransfer: () => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({
  user,
  onToggleCardFreeze,
  onOpenTransfer,
}) => {
  const [accountType, setAccountType] = useState<AccountSubType>('digital');
  const [copiedField, setCopiedField] = useState<'acc' | 'iban' | null>(null);

  const activeAccountNumber =
    accountType === 'digital' ? user.accountNumber : user.savingAccountNumber;
  const activeIban = accountType === 'digital' ? user.iban : user.savingIban;
  const activeBalance =
    accountType === 'digital' ? user.digitalBalance : user.savingBalance;

  const handleCopy = async (val: string, field: 'acc' | 'iban') => {
    try {
      await navigator.clipboard.writeText(val.replace(/\s+/g, ''));
    } catch {
      // Clipboard fallback ignored cleanly
    }
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1800);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F1F18] dark:text-emerald-50">
            حسابي البنكي في بنك السودان المركزي
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-emerald-200/70 mt-0.5">
            رقم حساب موحد وآيبان (IBAN) متوافق مع شبكة المقاصة القومية والدفع عبر NFC
          </p>
        </div>

        {/* Segmented Account Type Toggle */}
        <div
          role="tablist"
          aria-label="نوع الحساب"
          className="inline-flex p-1 bg-white dark:bg-[#0B1E17] border border-slate-200 dark:border-emerald-900/50 rounded-2xl self-start"
        >
          <button
            type="button"
            role="tab"
            aria-selected={accountType === 'saving'}
            onClick={() => setAccountType('saving')}
            className={`min-h-[42px] px-5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              accountType === 'saving'
                ? 'bg-[#064E3B] text-white'
                : 'text-slate-600 dark:text-emerald-200/70 hover:text-[#064E3B] dark:hover:text-white'
            }`}
          >
            حساب توفير
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={accountType === 'digital'}
            onClick={() => setAccountType('digital')}
            className={`min-h-[42px] px-5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              accountType === 'digital'
                ? 'bg-[#064E3B] text-white'
                : 'text-slate-600 dark:text-emerald-200/70 hover:text-[#064E3B] dark:hover:text-white'
            }`}
          >
            حساب جاري رقمي
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Vertical Sovereign Green & Gold Card */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div
            className={`w-60 h-[365px] rounded-[24px] p-5 text-white relative overflow-hidden flex flex-col justify-between shadow-xl shadow-[#064E3B]/25 border border-[#D4AF37]/45 transition-all duration-300 ${
              user.cardFrozen
                ? 'bg-slate-700 grayscale'
                : accountType === 'digital'
                ? 'cbos-card-gradient'
                : 'cbos-savings-gradient'
            }`}
          >
            <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-[#D4AF37]/[0.08] pointer-events-none" />

            <div className="flex justify-between items-start relative z-10">
              <div
                style={{ writingMode: 'vertical-rl' }}
                className="text-xs tracking-[0.25em] font-bold text-[#D4AF37] select-none"
              >
                CBOS SUDAN
              </div>
              <div className="w-11 h-16 border-[5px] border-[#D4AF37]/85 border-r-0 rounded-l-full" />
            </div>

            <div className="mt-auto mb-5 relative z-10 space-y-1.5">
              <div className="text-[10px] tracking-[0.15em] text-emerald-100/75">
                IBAN · SUDAN
              </div>
              <div
                dir="ltr"
                className="font-mono-num text-xs font-bold tracking-wider text-right"
              >
                {activeIban}
              </div>
            </div>

            <div className="flex justify-between items-end relative z-10">
              <span className="text-[11px] text-emerald-100/85">
                {user.cardFrozen
                  ? 'البطاقة مجمدة مؤقتاً'
                  : accountType === 'digital'
                  ? 'حساب جاري موثق بالوجه'
                  : 'حساب ادخار إسلامي'}
              </span>
              <div
                style={{ writingMode: 'vertical-rl' }}
                className="text-lg font-extrabold tracking-widest text-[#D4AF37] select-none"
              >
                CBOS
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-emerald-200/75">
            <Wifi className="w-4 h-4 rotate-90 text-[#064E3B] dark:text-[#D4AF37]" />
            <span>دفع لا تلامسي عبر NFC وQR مفعّل</span>
          </div>
        </div>

        {/* Account Details & Actions */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0B1E17] rounded-3xl border border-slate-200 dark:border-emerald-900/50 p-6 space-y-5">
          <div>
            <span className="text-xs font-bold text-[#047857] dark:text-[#D4AF37]">
              {accountType === 'digital'
                ? 'الحساب الرقمي الموحد - بنك السودان المركزي CBOS'
                : 'حساب التوفير المصرفي - CBOS'}
            </span>
            <h2 className="text-2xl font-extrabold font-mono-num text-[#0F1F18] dark:text-emerald-50 mt-1">
              {formatSdg(activeBalance)}{' '}
              <span className="text-sm font-bold text-slate-500 dark:text-emerald-200/70">
                ج.س
              </span>
            </h2>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-emerald-900/40 border-y border-slate-100 dark:border-emerald-900/40">
            <div className="py-3.5 flex items-center justify-between gap-3">
              <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-emerald-200/75">
                رقم الحساب المحلي
              </span>
              <div className="flex items-center gap-2">
                <span
                  dir="ltr"
                  className="font-mono-num text-sm font-bold text-[#0F1F18] dark:text-emerald-50"
                >
                  {activeAccountNumber}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(activeAccountNumber, 'acc')}
                  className="min-h-[36px] min-w-[36px] rounded-lg bg-slate-100 dark:bg-[#112A21] hover:bg-slate-200 flex items-center justify-center text-[#064E3B] dark:text-[#D4AF37] cursor-pointer"
                  aria-label="نسخ رقم الحساب"
                >
                  {copiedField === 'acc' ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="py-3.5 flex items-center justify-between gap-3">
              <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-emerald-200/75">
                رقم الحساب الدولي (IBAN)
              </span>
              <div className="flex items-center gap-2">
                <span
                  dir="ltr"
                  className="font-mono-num text-xs sm:text-sm font-bold text-[#0F1F18] dark:text-emerald-50"
                >
                  {activeIban}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(activeIban, 'iban')}
                  className="min-h-[36px] min-w-[36px] rounded-lg bg-slate-100 dark:bg-[#112A21] hover:bg-slate-200 flex items-center justify-center text-[#064E3B] dark:text-[#D4AF37] cursor-pointer"
                  aria-label="نسخ الآيبان"
                >
                  {copiedField === 'iban' ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="py-3.5 flex items-center justify-between gap-3">
              <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-emerald-200/75">
                صاحب الحساب الموثق
              </span>
              <span className="text-sm font-bold text-[#0F1F18] dark:text-emerald-50">
                {user.fullName}
              </span>
            </div>

            <div className="py-3.5 flex items-center justify-between gap-3">
              <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-emerald-200/75">
                حالة البطاقة
              </span>
              <span
                className={`text-sm font-bold ${
                  user.cardFrozen
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {user.cardFrozen ? 'مجمدة مؤقتاً' : 'نشطة وجاهزة للتحويل'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={onOpenTransfer}
              disabled={user.cardFrozen}
              className="min-h-[48px] px-5 py-3 rounded-2xl cbos-gradient text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-45 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 text-[#D4AF37]" />
              <span>تحويل</span>
            </button>

            <button
              type="button"
              onClick={onToggleCardFreeze}
              className="min-h-[48px] px-5 py-3 rounded-2xl border border-slate-200 dark:border-emerald-900 bg-white dark:bg-[#112A21] text-slate-800 dark:text-emerald-100 text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-emerald-950 cursor-pointer"
            >
              {user.cardFrozen ? (
                <>
                  <Unlock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>إلغاء تجميد البطاقة</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-slate-600 dark:text-emerald-300" />
                  <span>تجميد البطاقة مؤقتاً</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
