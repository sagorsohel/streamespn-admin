import React from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle, Info, X } from 'lucide-react';

export type ConfirmVariant = 'danger' | 'primary' | 'emerald' | 'amber';

export interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = 'Please Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  loading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-rose-400" />,
          iconBg: 'bg-rose-500/15 border-rose-500/30 text-rose-400 shadow-rose-950/40',
          confirmBtn:
            'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-rose-950/50 border-rose-500/50',
        };
      case 'emerald':
        return {
          icon: <CheckCircle2 className="h-6 w-6 text-emerald-400" />,
          iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-emerald-950/40',
          confirmBtn:
            'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-emerald-950/50 border-emerald-500/50',
        };
      case 'amber':
        return {
          icon: <HelpCircle className="h-6 w-6 text-amber-400" />,
          iconBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-amber-950/40',
          confirmBtn:
            'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-amber-950/50 border-amber-400/50',
        };
      default:
        return {
          icon: <Info className="h-6 w-6 text-rose-400" />,
          iconBg: 'bg-rose-500/15 border-rose-500/30 text-rose-400 shadow-rose-950/40',
          confirmBtn:
            'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-rose-950/50 border-rose-500/50',
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/80 text-slate-100 space-y-4 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header with Icon Badge */}
        <div className="flex items-start gap-3.5 pr-6">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-md ${vStyles.iconBg}`}
          >
            {vStyles.icon}
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white tracking-wide">{title}</h3>
            <div className="text-xs text-slate-300 leading-relaxed">{message}</div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-xl border px-4 py-2 text-xs font-bold shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${vStyles.confirmBtn}`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
