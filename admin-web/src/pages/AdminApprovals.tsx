import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { ApprovalRequest } from '../types';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Building2,
  CreditCard,
  AlertTriangle,
  FileCheck,
  ArrowRight,
  X,
  Loader2
} from 'lucide-react';

export const AdminApprovals: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ONBOARDING' | 'SETTLEMENTS' | 'REFUNDS'>('ONBOARDING');
  const [approvals, setApprovals] = useState<{
    pendingRestaurants: ApprovalRequest[];
    pendingSettlements: ApprovalRequest[];
    refundDisputes: ApprovalRequest[];
  }>({
    pendingRestaurants: [],
    pendingSettlements: [],
    refundDisputes: []
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadApprovals = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.fetchApprovals();
      if (res.success && res.data) {
        setApprovals(res.data);
      }
    } catch (err) {
      console.error('[AdminApprovals] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const openReviewModal = (item: ApprovalRequest, defaultDecision: 'APPROVED' | 'REJECTED') => {
    setSelectedRequest(item);
    setDecision(defaultDecision);
    setReason(defaultDecision === 'APPROVED' ? 'Standard compliance verification and legal documentation verified.' : 'Incomplete documentation or compliance discrepancy.');
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !reason.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await adminApi.reviewApproval(selectedRequest.id, {
        type: selectedRequest.type,
        decision,
        reason: reason.trim(),
        targetId: selectedRequest.targetId
      });
      if (res.success) {
        setFeedback(res.message || `Approval request ${decision.toLowerCase()} successfully.`);
        setReviewModalOpen(false);
        await loadApprovals();
      }
    } catch (err) {
      console.error('[AdminApprovals] Review error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentList =
    activeTab === 'ONBOARDING'
      ? approvals.pendingRestaurants
      : activeTab === 'SETTLEMENTS'
      ? approvals.pendingSettlements
      : approvals.refundDisputes;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm dark:shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Onboarding & Approvals Queue</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
              AUDIT-LOCKED GOVERNANCE
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            SuperAdmin review workflow for merchant onboarding, tariff changes, settlements, and high-value refund requests.
          </p>
        </div>

        <button
          onClick={loadApprovals}
          className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer"
          title="Refresh Queue"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm">
        <button
          onClick={() => setActiveTab('ONBOARDING')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition ${
            activeTab === 'ONBOARDING'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Merchant Onboarding ({approvals.pendingRestaurants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SETTLEMENTS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition ${
            activeTab === 'SETTLEMENTS'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Settlement Payouts ({approvals.pendingSettlements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('REFUNDS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition ${
            activeTab === 'REFUNDS'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Refunds & Exceptions ({approvals.refundDisputes.length})</span>
        </button>
      </div>

      {/* Queue Items */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-16 text-slate-500 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-cyan-500 dark:border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span>Fetching approvals queue...</span>
            </div>
          </div>
        ) : currentList.length === 0 ? (
          <div className="text-center py-16 text-slate-500 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2 shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 dark:text-emerald-400 mx-auto" />
            <div className="text-sm font-bold text-slate-900 dark:text-white">Queue is clear!</div>
            <div className="text-xs">No pending requests awaiting administrative action in this category.</div>
          </div>
        ) : (
          currentList.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 p-5 rounded-3xl shadow-sm dark:shadow-lg transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30">
                    {item.type}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{item.title}</h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Requester: <strong className="text-slate-700 dark:text-slate-300">{item.requester}</strong></span>
                  {item.payload.city && <span>City: <strong className="text-slate-700 dark:text-slate-300">{item.payload.city}</strong></span>}
                  {item.payload.gstin && <span>GSTIN: <strong className="text-slate-700 dark:text-slate-300 font-mono">{item.payload.gstin}</strong></span>}
                  {item.payload.fssaiNumber && <span>FSSAI: <strong className="text-slate-700 dark:text-slate-300 font-mono">{item.payload.fssaiNumber}</strong></span>}
                  {item.payload.commissionRate && <span>Commission: <strong className="text-cyan-600 dark:text-cyan-400">{item.payload.commissionRate}%</strong></span>}
                  {item.payload.netPayable && <span>Net Payout: <strong className="text-emerald-600 dark:text-emerald-400">₹{item.payload.netPayable}</strong></span>}
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => openReviewModal(item, 'APPROVED')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition shadow-lg shadow-emerald-600/20 flex items-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => openReviewModal(item, 'REJECTED')}
                  className="px-4 py-2 bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/30 font-black rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {reviewModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0E131F] border border-slate-200 dark:border-slate-700/80 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {decision === 'APPROVED' ? 'Confirm Approval' : 'Confirm Rejection'}
              </h3>
              <button onClick={() => setReviewModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs space-y-1">
              <div className="font-extrabold text-slate-900 dark:text-white">{selectedRequest.title}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Target ID: {selectedRequest.targetId}</div>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Administrative Reason / Remarks <span className="text-rose-500 dark:text-rose-400">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Mandatory reasoning recorded into permanent audit trail"
                  rows={3}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2 font-black rounded-xl text-xs transition flex items-center space-x-1.5 text-white ${
                    decision === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? 'Evaluating...' : decision === 'APPROVED' ? 'Execute Approval' : 'Execute Rejection'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
