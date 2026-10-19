import React, { useState } from 'react';
import {
  X,
  Ban,
  AlertTriangle,
  Clock,
  UtensilsCrossed,
  Layers,
  Store,
  HelpCircle,
  Check
} from 'lucide-react';

export interface PredefinedRejectionReason {
  code: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const PREDEFINED_REASONS: PredefinedRejectionReason[] = [
  {
    code: 'ITEM_UNAVAILABLE',
    title: 'Item Unavailable',
    description: 'One or more requested items are out of stock.',
    icon: UtensilsCrossed
  },
  {
    code: 'KITCHEN_CAPACITY',
    title: 'Kitchen at Capacity',
    description: 'The kitchen cannot prepare additional orders right now.',
    icon: Layers
  },
  {
    code: 'RESTAURANT_CLOSING',
    title: 'Restaurant Closing',
    description: 'The restaurant is closing or has stopped accepting orders.',
    icon: Store
  },
  {
    code: 'PREP_TIME_TOO_LONG',
    title: 'Preparation Time Too Long',
    description: 'The order cannot be prepared within a reasonable time.',
    icon: Clock
  },
  {
    code: 'INGREDIENT_UNAVAILABLE',
    title: 'Ingredient Unavailable',
    description: 'Required ingredients are unavailable.',
    icon: AlertTriangle
  },
  {
    code: 'TEMPORARY_OPERATIONAL_ISSUE',
    title: 'Temporary Operational Issue',
    description: 'An unexpected operational issue prevents preparation.',
    icon: HelpCircle
  }
];

interface OrderRejectionModalProps {
  isOpen: boolean;
  orderNumber: string;
  tableNumber: string;
  isSubmitting?: boolean;
  onConfirm: (payload: { reasonCode: string; reason: string; customReason?: string }) => Promise<void> | void;
  onCancel: () => void;
}

export const OrderRejectionModal: React.FC<OrderRejectionModalProps> = ({
  isOpen,
  orderNumber,
  tableNumber,
  isSubmitting = false,
  onConfirm,
  onCancel
}) => {
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [customReasonText, setCustomReasonText] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isCustom = selectedCode === 'OTHER';
  const customTrimmed = customReasonText.trim();
  const isConfirmDisabled =
    isSubmitting ||
    !selectedCode ||
    (isCustom && (customTrimmed.length < 2 || customTrimmed.length > 250));

  const handleConfirm = async () => {
    setValidationError(null);
    if (!selectedCode) {
      setValidationError('Please select a reason for declining this order.');
      return;
    }

    if (isCustom) {
      if (customTrimmed.length < 2) {
        setValidationError('Please provide a custom reason of at least 2 characters.');
        return;
      }
      if (customTrimmed.length > 250) {
        setValidationError('Custom reason cannot exceed 250 characters.');
        return;
      }
      await onConfirm({
        reasonCode: 'OTHER',
        reason: customTrimmed,
        customReason: customTrimmed
      });
      return;
    }

    const matched = PREDEFINED_REASONS.find((r) => r.code === selectedCode);
    const finalReason = matched ? `${matched.title}: ${matched.description}` : selectedCode;
    await onConfirm({
      reasonCode: selectedCode,
      reason: finalReason
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="bg-[#111827] dark:bg-[#111827] border border-slate-700/80 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h2 id="reject-dialog-title" className="text-base font-extrabold text-white">
                Reject Order #{orderNumber}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Table #{tableNumber} • The customer will be immediately notified with the selected reason.
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Predefined Reasons Grid */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Select Rejection Reason <span className="text-rose-400">*</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PREDEFINED_REASONS.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedCode === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setSelectedCode(item.code);
                    setValidationError(null);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-start space-x-2.5 cursor-pointer relative ${
                    isSelected
                      ? 'bg-rose-500/15 border-rose-500 text-white shadow-md shadow-rose-500/10 ring-1 ring-rose-500'
                      : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-rose-500 text-white font-bold'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isSelected ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>

                  <div className="min-w-0 pr-1">
                    <div className="text-xs font-bold leading-tight">{item.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom / Other Reason Option */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setSelectedCode('OTHER');
                setValidationError(null);
              }}
              className={`w-full p-3 rounded-2xl border text-left transition-all flex items-start space-x-2.5 cursor-pointer ${
                isCustom
                  ? 'bg-rose-500/15 border-rose-500 text-white ring-1 ring-rose-500'
                  : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isCustom ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isCustom ? <Check className="w-4 h-4" /> : <HelpCircle className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold leading-tight">Other / Custom Reason</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Provide a customized explanation for the customer.
                </div>
              </div>
            </button>

            {isCustom && (
              <div className="mt-3 space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span>Custom Reason Explanation:</span>
                  <span className={customTrimmed.length > 250 ? 'text-rose-400' : 'text-slate-400'}>
                    {customTrimmed.length} / 250 characters
                  </span>
                </div>
                <textarea
                  value={customReasonText}
                  onChange={(e) => {
                    setCustomReasonText(e.target.value);
                    setValidationError(null);
                  }}
                  maxLength={250}
                  placeholder="Explain why this order could not be prepared (e.g. Special ingredient delayed by supplier)..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
                />
              </div>
            )}
          </div>

          {validationError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.98] transition shadow-lg shadow-rose-600/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-1.5"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
