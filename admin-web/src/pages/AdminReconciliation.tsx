import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { ReconciliationException } from '../types';
import {
  FileSpreadsheet,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  RefreshCw,
  Search,
  Building2,
  DollarSign,
  ArrowRight,
  X,
  Loader2
} from 'lucide-react';

export const AdminReconciliation: React.FC = () => {
  const [exceptions, setExceptions] = useState<ReconciliationException[]>([]);
  const [criticalCount, setCriticalCount] = useState<number>(0);
  const [highCount, setHighCount] = useState<number>(0);
  const [mediumCount, setMediumCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [resolveModalOpen, setResolveModalOpen] = useState<boolean>(false);
  const [selectedException, setSelectedException] = useState<ReconciliationException | null>(null);
  const [resolutionAction, setResolutionAction] = useState<string>('ADJUST_SETTLEMENT');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadExceptions = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.fetchReconciliationExceptions();
      if (res.success && res.data) {
        setExceptions(res.data.exceptions);
        setCriticalCount(res.data.criticalCount);
        setHighCount(res.data.highCount);
        setMediumCount(res.data.mediumCount);
      }
    } catch (err) {
      console.error('[AdminReconciliation] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExceptions();
  }, []);

  const openResolveModal = (exc: ReconciliationException) => {
    setSelectedException(exc);
    setResolutionNotes(`Investigated discrepancy in ${exc.referenceId}. Corrected via administrative reconciliation.`);
    setResolveModalOpen(true);
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedException || !resolutionNotes.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await adminApi.resolveReconciliationException({
        exceptionId: selectedException.id,
        action: resolutionAction,
        notes: resolutionNotes.trim()
      });
      if (res.success) {
        setFeedback(res.message || 'Reconciliation exception resolved successfully.');
        setResolveModalOpen(false);
        await loadExceptions();
      }

    } catch (err) {
      console.error('[AdminReconciliation] Resolve error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-slate-800 text-slate-400">LOW</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121826] border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-white tracking-tight">Match Payments & Settlements</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              LEDGER VERIFIED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated verification of payments, customer bills, and restaurant payouts.
          </p>
        </div>

        <button
          onClick={loadExceptions}
          className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 shrink-0"
          title="Check Payments & Settlements"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-[#121826] border border-slate-800 rounded-3xl space-y-1">
          <div className="text-xs font-black uppercase text-slate-400">Total Discrepancies</div>
          <div className="text-3xl font-black text-white">{exceptions.length}</div>
          <div className="text-[10px] text-slate-500">Cross-verified against bills & payouts</div>
        </div>

        <div className="p-5 bg-[#121826] border border-rose-500/30 rounded-3xl space-y-1">
          <div className="text-xs font-black uppercase text-rose-400">Critical Discrepancies</div>
          <div className="text-3xl font-black text-rose-400">{criticalCount}</div>
          <div className="text-[10px] text-slate-500">Payment amount mismatch</div>
        </div>

        <div className="p-5 bg-[#121826] border border-amber-500/30 rounded-3xl space-y-1">
          <div className="text-xs font-black uppercase text-amber-400">High Severity</div>
          <div className="text-3xl font-black text-amber-400">{highCount}</div>
          <div className="text-[10px] text-slate-500">Unlinked payment / bill status</div>
        </div>

        <div className="p-5 bg-[#121826] border border-blue-500/30 rounded-3xl space-y-1">
          <div className="text-xs font-black uppercase text-blue-400">Commission Variances</div>
          <div className="text-3xl font-black text-blue-400">{mediumCount}</div>
          <div className="text-[10px] text-slate-500">Tariff variance from standard 15%</div>
        </div>
      </div>

      {/* Exceptions Table */}
      <div className="bg-[#121826] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-400">
          <span>Active Payment Discrepancies ({exceptions.length})</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5">Discrepancy Type</th>
                <th className="p-3.5">Restaurant</th>
                <th className="p-3.5">Reference ID</th>
                <th className="p-3.5">Expected</th>
                <th className="p-3.5">Actual</th>
                <th className="p-3.5">Difference</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center p-12 text-slate-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      <span>Checking payments, bills, and payouts...</span>
                    </div>
                  </td>
                </tr>
              ) : exceptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-12 text-slate-500 space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <div className="text-white font-bold">100% Payments & Settlements Matched</div>
                    <div className="text-xs">All payments, customer bills, taxes, and restaurant payouts match with zero discrepancies.</div>
                  </td>
                </tr>
              ) : (
                exceptions.map((exc) => (
                  <tr key={exc.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5">{getSeverityBadge(exc.severity)}</td>
                    <td className="p-3.5">
                      <div className="font-extrabold text-white">{exc.type}</div>
                      <div className="text-[10px] text-slate-400 max-w-xs truncate">{exc.description}</div>
                    </td>
                    <td className="p-3.5 font-bold text-slate-300">{exc.restaurant}</td>
                    <td className="p-3.5 font-mono text-cyan-400 font-bold">{exc.referenceId}</td>
                    <td className="p-3.5 text-slate-300">₹{exc.expectedAmount.toFixed(2)}</td>
                    <td className="p-3.5 text-slate-300">₹{exc.actualAmount.toFixed(2)}</td>
                    <td className="p-3.5 font-bold text-rose-400">₹{exc.discrepancy.toFixed(2)}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => openResolveModal(exc)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 font-bold transition flex items-center space-x-1 ml-auto"
                      >
                        <span>Resolve</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Modal */}
      {resolveModalOpen && selectedException && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0E131F] border border-slate-700/80 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white">Resolve Payment Discrepancy</h3>
              <button onClick={() => setResolveModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs space-y-1">
              <div className="font-extrabold text-white">{selectedException.type}</div>
              <div className="text-slate-400">{selectedException.description}</div>
              <div className="text-rose-400 font-bold">Difference: ₹{selectedException.discrepancy}</div>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Resolution Action</label>
                <select
                  value={resolutionAction}
                  onChange={(e) => setResolutionAction(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-bold"
                >
                  <option value="ADJUST_SETTLEMENT">Apply Manual Payout Adjustment</option>
                  <option value="CREDIT_MERCHANT_LEDGER">Issue Restaurant Payout Credit</option>
                  <option value="OVERRIDE_GATEWAY_RECORD">Verify & Align Payment Status</option>
                  <option value="DISREGARD_WITH_NOTE">Mark Checked & Close Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Resolution Notes <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Record mandatory rationale for financial record ledger adjustment"
                  rows={3}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setResolveModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition"
                >
                  {isSubmitting ? 'Recording...' : 'Complete Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
