import React from 'react';
import {
  ArrowLeftRight,
  BatteryCharging,
  BatteryLow,
  BatteryMedium,
  LogOut,
  Mail,
  Moon,
  ShieldCheck,
  Smartphone,
  Sun,
} from 'lucide-react';
import { BankUserProfile } from '../types/bank';
import { PWAInstallButton } from './PWAInstallButton';

interface ProfileScreenProps {
  user: BankUserProfile;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isPowerSavingEnabled: boolean;
  onTogglePowerSaving: () => void;
  batteryLevel: number | null;
  isCharging: boolean;
  isLowBattery: boolean;
  syncIntervalMs: number;
  lastBalanceSyncLabel: string;
  onOpenDeviceTransfer: () => void;
  onOpenNotificationsLog: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  isDarkMode,
  onToggleDarkMode,
  isPowerSavingEnabled,
  onTogglePowerSaving,
  batteryLevel,
  isCharging,
  isLowBattery,
  syncIntervalMs,
  lastBalanceSyncLabel,
  onOpenDeviceTransfer,
  onOpenNotificationsLog,
  onOpenAdmin,
  onLogout,
}) => {
  const intervalLabel =
    syncIntervalMs >= 300_000
      ? 'كل 5 دقائق'
      : syncIntervalMs >= 120_000
      ? 'كل دقيقتين'
      : 'كل 15 ثانية';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F1F18] dark:text-emerald-50">
          الملف الشخصي وإعدادات الأمان
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-emerald-200/70 mt-0.5">
          بيانات الهوية المصرفية، البصمة الرياضية للوجه (512 رقماً)، والمظهر الداكن
        </p>
      </div>

      {/* Android Standalone App Install Card */}
      <div className="bg-white dark:bg-[#0B1E17] rounded-3xl border border-slate-200 dark:border-emerald-900/50 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl cbos-gradient text-[#D4AF37] flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[#0F1F18] dark:text-emerald-50">
                تثبيت التطبيق على الهاتف
              </h2>
              <p className="text-xs text-slate-500 dark:text-emerald-200/70 mt-0.5">
                أيقونة مستقلة على شاشة الهاتف · يعمل بملء الشاشة ويدعم عدم الاتصال بالإنترنت
              </p>
            </div>
          </div>

          <PWAInstallButton />
        </div>
      </div>

      {/* Dark Mode Toggle Card */}
      <div className="bg-white dark:bg-[#0B1E17] rounded-3xl border border-slate-200 dark:border-emerald-900/50 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-[#112A21] text-[#064E3B] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
              {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[#0F1F18] dark:text-emerald-50">
                الوضع المظلم
              </h2>
              <p className="text-xs text-slate-500 dark:text-emerald-200/70 mt-0.5">
                {isDarkMode
                  ? 'مفعّل — تدرجات زمردية وذهبية داكنة مريحة للعين'
                  : 'غير مفعّل — المظهر النهاري القياسي'}
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isDarkMode}
            aria-label="تفعيل الوضع المظلم"
            onClick={onToggleDarkMode}
            className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-[#064E3B] border-[#D4AF37]/60'
                : 'bg-slate-200 border-slate-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                isDarkMode ? '-translate-x-7' : '-translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Power Saving Mode Toggle Card */}
      <div className="bg-white dark:bg-[#0B1E17] rounded-3xl border border-slate-200 dark:border-emerald-900/50 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-[#112A21] text-[#064E3B] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
              {isCharging ? (
                <BatteryCharging className="w-5 h-5" />
              ) : isLowBattery ? (
                <BatteryLow className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              ) : (
                <BatteryMedium className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[#0F1F18] dark:text-emerald-50">
                وضع توفير الطاقة
              </h2>
              <p className="text-xs text-slate-500 dark:text-emerald-200/70 mt-0.5 leading-relaxed">
                {isPowerSavingEnabled
                  ? isLowBattery
                    ? `مفعّل (انخفاض الشحن ${batteryLevel}%) — يُحدَّث الرصيد في الخلفية ${intervalLabel} فقط للحفاظ على البطارية`
                    : `مفعّل${batteryLevel !== null ? ` (الشحن ${batteryLevel}%)` : ''} — التحديث في الخلفية ${intervalLabel} وينخفض تلقائياً عند بلوغ الشحن 20% فأقل`
                  : `غير مفعّل — يتم تحديث بيانات الرصيد في الخلفية ${intervalLabel}`}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-emerald-200/55 mt-1">
                آخر مزامنة للرصيد: {lastBalanceSyncLabel}
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isPowerSavingEnabled}
            aria-label="تفعيل وضع توفير الطاقة"
            onClick={onTogglePowerSaving}
            className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors cursor-pointer ${
              isPowerSavingEnabled
                ? 'bg-[#064E3B] border-[#D4AF37]/60'
                : 'bg-slate-200 border-slate-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                isPowerSavingEnabled ? '-translate-x-7' : '-translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Bound Device & Transfer Card */}
      <div className="bg-white dark:bg-[#0B1E17] rounded-3xl border border-slate-200 dark:border-emerald-900/50 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-[#112A21] text-[#064E3B] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[#0F1F18] dark:text-emerald-50">
                الجهاز الموثق: {user.boundDeviceName}
              </h2>
              <p className="text-xs text-slate-500 dark:text-emerald-200/70 mt-0.5">
                <span dir="ltr" className="font-mono-num">
                  {user.boundDeviceId}
                </span>{' '}
                · {user.lastMigrationAt}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-emerald-200/70 mt-1">
                أي نقل للحساب من هاتف إلى هاتف آخر يفرض التحقق عبر البصمة الرقمية للوجه.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenDeviceTransfer}
            className="min-h-[44px] px-4 py-2.5 rounded-xl cbos-gradient text-white text-xs font-extrabold flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer hover:opacity-95"
          >
            <ArrowLeftRight className="w-4 h-4 text-[#D4AF37]" />
            <span>نقل إلى هاتف آخر</span>
          </button>
        </div>
      </div>

      {/* Identity & Encrypted 512-Number Vector Card */}
      <div className="bg-white dark:bg-[#0B1E17] rounded-3xl border border-slate-200 dark:border-emerald-900/50 p-5 sm:p-6">
        <div className="flex items-center gap-4 pb-5 border-b border-slate-100 dark:border-emerald-900/40">
          <div className="w-14 h-14 rounded-2xl cbos-gradient text-[#D4AF37] flex items-center justify-center text-lg font-extrabold shrink-0">
            {user.initials}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#0F1F18] dark:text-emerald-50">
              {user.fullName}
            </h2>
            <p className="text-xs text-slate-500 dark:text-emerald-200/70 mt-0.5">
              هوية موثقة · نسبة مطابقة الوجه {user.matchConfidence} (دون تخزين صور السيلفي)
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-emerald-900/40 mt-2">
          <div className="py-3.5 flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-slate-600 dark:text-emerald-200/75">
              {user.documentType === 'national_id'
                ? 'الرقم الوطني الموثق'
                : 'رقم جواز السفر الموثق'}
            </span>
            <span dir="ltr" className="font-mono-num text-sm font-extrabold text-[#0F1F18] dark:text-emerald-50">
              {user.nationalId}
            </span>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-slate-600 dark:text-emerald-200/75">
              رقم الهاتف (+249)
            </span>
            <span dir="ltr" className="font-mono-num text-sm font-extrabold text-[#0F1F18] dark:text-emerald-50">
              {user.phone}
            </span>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-slate-600 dark:text-emerald-200/75">
              البريد الإلكتروني
            </span>
            <span dir="ltr" className="font-mono-num text-sm font-extrabold text-[#0F1F18] dark:text-emerald-50">
              {user.email}
            </span>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-slate-600 dark:text-emerald-200/75">
              رقم الحساب
            </span>
            <span dir="ltr" className="font-mono-num text-sm font-extrabold text-[#0F1F18] dark:text-emerald-50">
              {user.accountNumber}
            </span>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-slate-600 dark:text-emerald-200/75">
              رقم الآيبان (IBAN)
            </span>
            <span dir="ltr" className="font-mono-num text-xs sm:text-sm font-extrabold text-[#064E3B] dark:text-[#D4AF37]">
              {user.iban}
            </span>
          </div>

          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-600 dark:text-emerald-200/75">
              البصمة الرقمية المشفرة للوجه (512 رقماً)
            </span>
            <span dir="ltr" className="font-mono-num text-xs font-bold text-[#064E3B] dark:text-emerald-300">
              {user.faceVectorHash} · [{user.faceVector512Preview.slice(0, 4).join(', ')}, ...]
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={onOpenNotificationsLog}
          className="min-h-[48px] px-4 py-3 rounded-2xl border border-slate-200 dark:border-emerald-900 bg-white dark:bg-[#0B1E17] text-[#064E3B] dark:text-[#D4AF37] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-[#112A21] cursor-pointer"
        >
          <Mail className="w-4 h-4" />
          <span>سجل SMS والبريد</span>
        </button>

        <button
          type="button"
          onClick={onOpenAdmin}
          className="min-h-[48px] px-4 py-3 rounded-2xl border border-slate-200 dark:border-emerald-900 bg-white dark:bg-[#0B1E17] text-[#064E3B] dark:text-[#D4AF37] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-[#112A21] cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>لوحة البنك المركزي</span>
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="min-h-[48px] px-4 py-3 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-50 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
};
