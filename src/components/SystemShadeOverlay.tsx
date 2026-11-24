import React, { useState } from 'react';
import {
  ArrowUpRight,
  Bell,
  Eye,
  EyeOff,
  FileText,
  Landmark,
  QrCode,
  Nfc,
  Smartphone,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { BankTransaction, BankUserProfile } from '../types/bank';
import { formatSdg } from '../data/sudanBanks';

interface SystemShadeOverlayProps {
  isOpen: boolean;
  user: BankUserProfile;
  lastTransaction?: BankTransaction;
  isOffline: boolean;
  onClose: () => void;
  onQuickTransfer: () => void;
  onQuickQr: () => void;
  onQuickNfc: () => void;
  onOpenStatements: () => void;
  onToggleOffline: () => void;
}

export const SystemShadeOverlay: React.FC<SystemShadeOverlayProps> = ({
  isOpen,
  user,
  lastTransaction,
  isOffline,
  onClose,
  onQuickTransfer,
  onQuickQr,
  onQuickNfc,
  onOpenStatements,
  onToggleOffline,
}) => {
  const [tileHideBalance, setTileHideBalance] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#041E15]/80 backdrop-blur-md flex justify-center items-start p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="ستارة إشعارات الهاتف والاختصارات السريعة"
    >
      <div className="w-full max-w-md bg-[#0B1E17] text-emerald-50 border border-emerald-800/70 rounded-3xl p-5 shadow-2xl space-y-5">
        {/* Shade Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-xs font-extrabold text-emerald-100">
              ستارة إشعارات الهاتف وأداة الشاشة الرئيسية
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق الستارة"
            className="min-h-[44px] min-w-[44px] rounded-full bg-emerald-950 hover:bg-emerald-900 flex items-center justify-center text-emerald-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Android Quick Settings Tile Grid */}
        <section className="space-y-2">
          <h3 className="text-[11px] font-bold text-emerald-200/70">
            اختصارات الإعدادات السريعة على الهاتف
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onQuickTransfer();
              }}
              className="min-h-[56px] rounded-2xl bg-[#064E3B] border border-[#D4AF37]/60 px-3.5 py-2.5 text-right flex items-center gap-3 hover:bg-[#075e47] transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-[#D4AF37] text-[#04281B] flex items-center justify-center shrink-0">
                <Landmark className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-white truncate">
                  CBOS Bank
                </div>
                <div className="text-[11px] text-emerald-200 truncate">
                  تحويل سريع فوري
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={onToggleOffline}
              className={`min-h-[56px] rounded-2xl border px-3.5 py-2.5 text-right flex items-center gap-3 transition-colors cursor-pointer ${
                isOffline
                  ? 'bg-amber-950/70 border-amber-500/60 text-amber-100'
                  : 'bg-[#112A21] border-emerald-800/70 text-emerald-100 hover:border-emerald-600'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                {isOffline ? (
                  <WifiOff className="w-4 h-4 text-amber-300" />
                ) : (
                  <Wifi className="w-4 h-4 text-emerald-300" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold truncate">
                  {isOffline ? 'وضع عدم الاتصال' : 'متصل بالشبكة'}
                </div>
                <div className="text-[11px] opacity-75 truncate">
                  {isOffline ? 'حفظ محلي للتحويلات' : 'مقاصة مباشرة'}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onQuickQr();
              }}
              className="min-h-[52px] rounded-2xl bg-[#112A21] border border-emerald-800/70 px-3.5 py-2 text-right flex items-center gap-2.5 hover:border-[#D4AF37]/60 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span className="text-xs font-bold text-emerald-50">تحويل عبر QR</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onQuickNfc();
              }}
              className="min-h-[52px] rounded-2xl bg-[#112A21] border border-emerald-800/70 px-3.5 py-2 text-right flex items-center gap-2.5 hover:border-[#D4AF37]/60 cursor-pointer"
            >
              <Nfc className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span className="text-xs font-bold text-emerald-50">تحويل عبر NFC</span>
            </button>
          </div>
        </section>

        {/* Persistent Notification Card */}
        <section className="space-y-2">
          <h3 className="text-[11px] font-bold text-emerald-200/70 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>الإشعار الدائم في شريط الإشعارات</span>
          </h3>

          <div className="rounded-2xl bg-[#112A21] border border-emerald-800/70 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-extrabold text-[#D4AF37]">
                  بنك السودان المركزي - CBOS · حساب نشط
                </div>
                <div className="text-sm font-extrabold font-mono-num text-white mt-1 whitespace-nowrap">
                  الرصيد: {tileHideBalance ? '••••••••' : `${formatSdg(user.digitalBalance)} ج.س`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTileHideBalance((p) => !p)}
                aria-label={tileHideBalance ? 'إظهار الرصيد' : 'إخفاء الرصيد'}
                className="min-h-[38px] min-w-[38px] rounded-xl bg-white/10 flex items-center justify-center text-emerald-100 cursor-pointer"
              >
                {tileHideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="text-xs text-emerald-200/80 border-t border-emerald-800/60 pt-2.5">
              {lastTransaction ? (
                <span>
                  آخر عملية: {lastTransaction.title} ·{' '}
                  <span dir="ltr" className="font-mono-num font-bold text-white">
                    {lastTransaction.type === 'credit' ? '+' : '-'}
                    {formatSdg(lastTransaction.amount)} ج.س
                  </span>
                </span>
              ) : (
                <span>لا توجد عمليات حديثة مسجلة اليوم.</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onQuickTransfer();
                }}
                className="min-h-[44px] rounded-xl bg-[#064E3B] hover:bg-[#08624a] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4 text-[#D4AF37]" />
                <span>تحويل سريع</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStatements();
                }}
                className="min-h-[44px] rounded-xl bg-white/10 hover:bg-white/15 text-emerald-50 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#D4AF37]" />
                <span>كشف حساب</span>
              </button>
            </div>
          </div>
        </section>

        {/* Home Screen Widget Preview */}
        <section className="space-y-2">
          <h3 className="text-[11px] font-bold text-emerald-200/70">
            أداة الرصيد على الشاشة الرئيسية
          </h3>
          <div className="rounded-2xl cbos-gradient border border-[#D4AF37]/50 p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-[#D4AF37]">
                CBOS Bank · الرصيد المتاح
              </div>
              <div className="text-lg font-extrabold font-mono-num text-white mt-0.5 whitespace-nowrap">
                {tileHideBalance ? '••••••••' : `${formatSdg(user.digitalBalance)} ج.س`}
              </div>
              <div
                dir="ltr"
                className="text-[11px] font-mono-num text-emerald-100/80 truncate mt-1 text-right"
              >
                {user.iban}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onQuickQr();
              }}
              className="min-h-[44px] px-3.5 rounded-xl bg-[#D4AF37] text-[#04281B] text-xs font-extrabold whitespace-nowrap shrink-0 cursor-pointer"
            >
              مسح QR
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
