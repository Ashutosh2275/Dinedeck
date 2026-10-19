import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { AdminBill, AdminPayment, AdminSettlement } from '../types';
import {
  DollarSign,
  Receipt,
  CreditCard,
  Percent,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  Check
} from 'lucide-react';

export const AdminFinance: React.FC = () => {
  const [bills, setBills] = useState<AdminBill[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [settlements, setSettlements] = useState<AdminSettlement[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'SETTLEMENTS' | 'INVOICES' | 'PAYMENTS'>('SETTLEMENTS');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadFinancialData = async () => {
    setIsLoading(true);
    try {
      const [bRes, pRes, sRes] = await Promise.all([
        adminApi.fetchBills(),
        adminApi.fetchPayments(),
        adminApi.fetchSettlements()
      ]);
      if (bRes.success && bRes.data) setBills(bRes.data);
      if (pRes.success && pRes.data) setPayments(pRes.data);
      if (sRes.success && sRes.data) setSettlements(sRes.data);
    } catch (err) {
      console.error('[AdminFinance] Error loading finance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, []);

  const handleProcessPayout = async (settlementId: string) => {
    setProcessingId(settlementId);
    try {
      await adminApi.processSettlement(settlementId);
      loadFinancialData();
    } finally {
      setProcessingId(null);
    }
  };

  const totalGrossSettled = bills
    .filter((b) => b.paymentStatus === 'PAID')
    .reduce((sum, b) => sum + b.grandTotal, 0);

  const totalCommissionEarned = Math.round(totalGrossSettled * 0.15 * 100) / 100;
  const netPayable = totalGrossSettled - totalCommissionEarned;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Finance & Merchant Settlement Center</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Canonical 15% platform commission ledger, tax invoicing, and merchant payouts.
          </p>
        </div>

        <button
          onClick={() => loadFinancialData()}
          className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition border border-slate-300 dark:border-slate-700 self-start sm:self-auto cursor-pointer"
          title="Refresh Financial Ledger"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Financial KPIs Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-gradient-to-br dark:from-[#121826] dark:to-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Total Gross Platform GMV</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">₹{totalGrossSettled.toFixed(2)}</div>
          <div className="text-[11px] text-slate-500">Authoritative backend settled revenue</div>
        </div>

        <div className="p-5 bg-white dark:bg-gradient-to-br dark:from-[#121826] dark:to-cyan-950/30 border border-cyan-500/30 rounded-3xl space-y-2 shadow-sm">
          <div className="text-xs font-bold uppercase text-cyan-600 dark:text-cyan-400">DINEDECK 15% Platform Commission</div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-600 dark:text-cyan-400">₹{totalCommissionEarned.toFixed(2)}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Automatic platform deduction</div>
        </div>

        <div className="p-5 bg-white dark:bg-gradient-to-br dark:from-[#121826] dark:to-emerald-950/30 border border-emerald-500/30 rounded-3xl space-y-2 shadow-sm">
          <div className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">Net Merchant Payable Payout</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">₹{netPayable.toFixed(2)}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Direct NEFT/RTGS settlement batch</div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex bg-slate-100 dark:bg-[#121826] border border-slate-200 dark:border-slate-800 rounded-2xl p-1 max-w-md">
        <button
          onClick={() => setActiveSubTab('SETTLEMENTS')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'SETTLEMENTS' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Settlements & Payouts
        </button>
        <button
          onClick={() => setActiveSubTab('INVOICES')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'INVOICES' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Tax Invoices ({bills.length})
        </button>
        <button
          onClick={() => setActiveSubTab('PAYMENTS')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'PAYMENTS' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Gateway Ledger
        </button>
      </div>

      {activeSubTab === 'SETTLEMENTS' && (
        <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-4">Merchant</th>
                  <th className="px-4 py-4">Gross Sales</th>
                  <th className="px-4 py-4">15% Comm. Deducted</th>
                  <th className="px-4 py-4">GST Taxes</th>
                  <th className="px-4 py-4">Net Payable</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {settlements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-50" />
                      <p className="font-semibold text-slate-400">No settlement cycles recorded</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Merchant settlements will appear here as orders complete and payment cycles close.
                      </p>
                    </td>
                  </tr>
                ) : (
                  settlements.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4 font-bold text-white">
                        {s.restaurant?.name || 'Partner Merchant'}
                        <div className="text-[10px] text-slate-500">
                          {s.settlementNumber || s.id} {s.restaurant?.city ? `• ${s.restaurant.city}` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono font-bold text-white">
                        ₹{Number(s.grossOrderValue || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 font-mono text-cyan-400 font-bold">
                        -₹{Number(s.dinedeckCommission || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 font-mono text-purple-400">
                        ₹{Number(s.taxCollected || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 font-mono font-black text-emerald-400">
                        ₹{Number(s.netPayable || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            s.status === 'SETTLED'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : s.status === 'PROCESSING'
                              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {s.status === 'PENDING' ? (
                          <button
                            onClick={() => handleProcessPayout(s.id)}
                            disabled={processingId === s.id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-md disabled:opacity-50"
                          >
                            {processingId === s.id ? 'Processing...' : 'Disburse Payout'}
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[10px]">
                            {s.status === 'SETTLED' ? 'Settled' : 'In Progress'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoices View */}
      {activeSubTab === 'INVOICES' && (
        <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-4">Invoice #</th>
                  <th className="px-4 py-4">Restaurant & Table</th>
                  <th className="px-4 py-4">Subtotal</th>
                  <th className="px-4 py-4">Taxes & Service</th>
                  <th className="px-4 py-4">Grand Total</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-400 dark:text-slate-600 opacity-50" />
                      <p className="font-semibold text-slate-600 dark:text-slate-400">No invoices generated yet</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Invoices generated for dine-in and online orders will appear here automatically.
                      </p>
                    </td>
                  </tr>
                ) : (
                  bills.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
                        {b.billNumber || b.id}
                      </td>
                      <td className="px-4 py-4 font-bold text-slate-900 dark:text-white">
                        {b.restaurant?.name || 'Restaurant'}
                        <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-normal">
                          {b.tableNumber ? `Table #${b.tableNumber}` : 'Direct Order'}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono">₹{Number(b.subtotal || 0).toFixed(2)}</td>
                      <td className="px-4 py-4 font-mono text-purple-600 dark:text-purple-400">
                        ₹{(Number(b.cgstAmount || 0) + Number(b.sgstAmount || 0) + Number(b.serviceCharge || 0)).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 font-mono font-black text-emerald-600 dark:text-emerald-400">
                        ₹{Number(b.grandTotal || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                          {b.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-[10px] text-slate-500">
                        {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gateway Payments View */}
      {activeSubTab === 'PAYMENTS' && (
        <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-4">Gateway Ref</th>
                  <th className="px-4 py-4">Method</th>
                  <th className="px-4 py-4">Payable Amount</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Settlement Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-50" />
                      <p className="font-semibold text-slate-400">No gateway transactions recorded</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Payments processed via UPI, Cards, or Netbanking will appear here in real-time.
                      </p>
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4 font-mono font-bold text-white">
                        {p.transactionRef || p.id}
                        {p.bill?.restaurant?.name && (
                          <div className="text-[10px] text-slate-500 font-normal">{p.bill.restaurant.name}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 font-bold text-white flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase">
                          {p.method || 'GATEWAY'}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono font-bold text-emerald-400">
                        ₹{Number(p.amount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            p.status === 'PAID'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-[10px] text-slate-500">
                        {p.createdAt ? new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
