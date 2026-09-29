import React, { useState } from 'react';
import { adminApi } from '../services/api';
import { Layers, AlertTriangle, CheckCircle2, X, Loader2, Building2 } from 'lucide-react';

interface BulkOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRestaurantIds: string[];
  selectedRestaurantNames: string[];
  onSuccess: () => void;
}

export const BulkOperationsModal: React.FC<BulkOperationsModalProps> = ({
  isOpen,
  onClose,
  selectedRestaurantIds,
  selectedRestaurantNames,
  onSuccess
}) => {
  const [action, setAction] = useState<'BULK_ACTIVATE' | 'BULK_SUSPEND' | 'BULK_SET_COMMISSION' | 'BULK_NOTIFY'>('BULK_ACTIVATE');
  const [commissionRate, setCommissionRate] = useState<number>(15.0);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const count = selectedRestaurantIds.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A mandatory reason is required for administrative audit logs.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResultMessage(null);

    try {
      const payload: any = {};
      if (action === 'BULK_SET_COMMISSION') {
        payload.commissionRatePercent = Number(commissionRate);
      }

      const res = await adminApi.executeBulkOperation({
        action,
        targetRestaurantIds: selectedRestaurantIds,
        payload,
        reason: reason.trim()
      });

      if (res.success) {
        setResultMessage(res.message || 'Bulk operation completed successfully.');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {

        setError(res.message || 'Bulk operation failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error executing bulk action.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0E131F] border border-slate-700/80 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Bulk Multi-Tenant Operation</h2>
              <p className="text-xs text-slate-400">Target Count Verification & Audit-Locked Mutation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Count Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-amber-300">Exact Target Count Verification</div>
              <div className="text-[11px] text-amber-200/80">
                Action will affect <span className="font-black underline">{count} restaurants</span> simultaneously.
              </div>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-500 text-black font-black text-xs rounded-xl shadow">
            {count} Selected
          </span>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs font-bold text-center">
            {error}
          </div>
        )}

        {resultMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-bold text-center flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{resultMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Select Action</label>
            <select
              value={action}
              onChange={(e: any) => setAction(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-bold"
            >
              <option value="BULK_ACTIVATE">Bulk Activate & Restore (Set status ACTIVE)</option>
              <option value="BULK_SUSPEND">Bulk Emergency Suspend (Set status SUSPENDED)</option>
              <option value="BULK_SET_COMMISSION">Bulk Standardize Commission Rate %</option>
              <option value="BULK_NOTIFY">Bulk Dispatch Operator Advisory</option>
            </select>
          </div>

          {action === 'BULK_SET_COMMISSION' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">New Commission Rate (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-bold"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Audit Reason <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Scheduled regional tariff update or emergency operational quarantine"
              rows={2}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || count === 0}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 shadow-lg disabled:opacity-50 ${
                action === 'BULK_SUSPEND'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/30'
              }`}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isSubmitting ? 'Executing Mutation...' : `Apply to ${count} Tenants`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
