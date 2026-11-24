import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { formatSdg } from '../data/sudanBanks';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteDeposit: (amount: number, source: string) => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  onExecuteDeposit,
}) => {
  const [amount, setAmount] = useState('150000');
  const [source, setSource] = useState('إيداع وكيل معتمد - الخرطوم');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0) return;
    onExecuteDeposit(num, source);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#041E15]/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="إيداع فوري"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#0B1E17] border border-transparent dark:border-emerald-900/50 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
        <div className="w-10 h-1.5 bg-slate-200 dark:bg-emerald-900 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-[#0F1F18] dark:text-emerald-50">
            إيداع رصيد فوري
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="min-h-[44px] min-w-[44px] rounded-full bg-slate-100 dark:bg-emerald-950 hover:bg-slate-200 dark:hover:bg-emerald-900 flex items-center justify-center text-slate-700 dark:text-emerald-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="deposit-source"
              className="block text-xs font-bold text-slate-700 dark:text-emerald-100 mb-1.5"
            >
              قناة الإيداع
            </label>
            <select
              id="deposit-source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-slate-50/70 dark:bg-[#112A21] text-sm font-semibold text-[#0F1F18] dark:text-emerald-50"
            >
              <option value="إيداع وكيل معتمد - الخرطوم">إيداع وكيل معتمد - الخرطوم</option>
              <option value="تحويل راتب حكومي موحد">تحويل راتب حكومي موحد</option>
              <option value="تغذية من محفظة هاتف محلية">تغذية من محفظة هاتف محلية</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="deposit-amount"
              className="block text-xs font-bold text-slate-700 dark:text-emerald-100 mb-1.5"
            >
              مبلغ الإيداع (SDG)
            </label>
            <input
              id="deposit-amount"
              type="number"
              min={100}
              dir="ltr"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full min-h-[48px] px-4 rounded-xl border border-slate-200 dark:border-emerald-900/60 bg-slate-50/70 dark:bg-[#112A21] text-base font-extrabold font-mono-num text-right text-[#0F1F18] dark:text-emerald-50"
            />
            <div className="flex gap-2 mt-2">
              {[50000, 150000, 500000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className="flex-1 min-h-[36px] rounded-lg bg-slate-100 dark:bg-[#112A21] hover:bg-slate-200 dark:hover:bg-emerald-950 text-xs font-bold font-mono-num text-[#064E3B] dark:text-[#D4AF37] cursor-pointer"
                >
                  +{formatSdg(preset).replace('.00', '')}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full min-h-[50px] rounded-2xl cbos-gradient text-white text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>إضافة الرصيد للحساب الآن</span>
          </button>
        </form>
      </div>
    </div>
  );
};
