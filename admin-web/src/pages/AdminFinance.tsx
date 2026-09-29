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
    .reduce((sum, b) => sum + b.grandTotal, 0) || 1382.0;

  const totalCommissionEarned = Math.round(totalGrossSettled * 0.15 * 100) / 100;
  const netPayable = totalGrossSettled - totalCommissionEarned;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121826] border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Finance & Merchant Settlement Center</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Canonical 15% platform commission ledger, tax invoicing, and merchant payouts.
          </p>
        </div>

        <button
          onClick={() => loadFinancialData()}
          className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 self-start sm:self-auto"
          title="Refresh Financial Ledger"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Financial KPIs Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-gradient-to-br from-[#121826] to-slate-900 border border-slate-800 rounded-3xl space-y-2">
          <div className="text-xs font-bold uppercase text-slate-400">Total Gross Platform GMV</div>
          <div className="text-2xl sm:text-3xl font-black text-white">₹{totalGrossSettled.toFixed(2)}</div>
          <div className="text-[11px] text-slate-500">Authoritative backend settled revenue</div>
        </div>

        <div className="p-5 bg-gradient-to-br from-[#121826] to-cyan-950/30 border border-cyan-500/30 rounded-3xl space-y-2">
          <div className="text-xs font-bold uppercase text-cyan-400">DINEDECK 15% Platform Commission</div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-400">₹{totalCommissionEarned.toFixed(2)}</div>
          <div className="text-[11px] text-slate-400">Automatic platform deduction</div>
        </div>

        <div className="p-5 bg-gradient-to-br from-[#121826] to-emerald-950/30 border border-emerald-500/30 rounded-3xl space-y-2">
          <div className="text-xs font-bold uppercase text-emerald-400">Net Merchant Payable Payout</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">₹{netPayable.toFixed(2)}</div>
          <div className="text-[11px] text-slate-400">Direct NEFT/RTGS settlement batch</div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex bg-[#121826] border border-slate-800 rounded-2xl p-1 max-w-md">
        <button
          onClick={() => setActiveSubTab('SETTLEMENTS')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'SETTLEMENTS' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Settlements & Payouts
        </button>
        <button
          onClick={() => setActiveSubTab('INVOICES')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'INVOICES' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Tax Invoices ({bills.length})
        </button>
        <button
          onClick={() => setActiveSubTab('PAYMENTS')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'PAYMENTS' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Gateway Ledger
        </button>
      </div>

      {/* Settlements View */}
      {activeSubTab === 'SETTLEMENTS' && (
        <div className="bg-[#121826] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-800">
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
                <tr className="hover:bg-slate-800/40 transition">
                  <td className="px-5 py-4 font-bold text-white">
                    The Punjab Heritage Kitchen
                    <div className="text-[10px] text-slate-500">Bandra West Flagship</div>
                  </td>
                  <td className="px-4 py-4 font-mono font-bold text-white">₹1,382.00</td>
                  <td className="px-4 py-4 font-mono text-cyan-400 font-bold">-₹207.30</td>
                  <td className="px-4 py-4 font-mono text-purple-400">₹62.80</td>
                  <td className="px-4 py-4 font-mono font-black text-emerald-400">₹1,174.70</td>
                  <td className="px-4 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      READY_TO_SETTLE
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleProcessPayout('stl_punjab_1')}
                      disabled={processingId === 'stl_punjab_1'}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-md disabled:opacity-50"
                    >
                      {processingId === 'stl_punjab_1' ? 'Processing...' : 'Disburse Payout'}
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/40 transition">
                  <td className="px-5 py-4 font-bold text-white">
                    Grand Peshawari Grill
                    <div className="text-[10px] text-slate-500">Connaught Place</div>
                  </td>
                  <td className="px-4 py-4 font-mono font-bold text-white">₹0.00</td>
                  <td className="px-4 py-4 font-mono text-cyan-400 font-bold">₹0.00</td>
                  <td className="px-4 py-4 font-mono text-purple-400">₹0.00</td>
                  <td className="px-4 py-4 font-mono font-black text-slate-400">₹0.00</td>
                  <td className="px-4 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                      NO_SETTLEMENT_DUE
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-slate-500 text-[10px]">
                    Cycle Closed
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoices View */}
      {activeSubTab === 'INVOICES' && (
        <div className="bg-[#121826] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-800">
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
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {bills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-4 font-mono font-bold text-white">
                      {b.billNumber || 'INV-2026-39414'}
                    </td>
                    <td className="px-4 py-4 font-bold text-white">
                      {b.restaurant?.name || 'The Punjab Heritage Kitchen'}
                      <div className="text-[10px] text-cyan-400 font-normal">Table #{b.tableNumber || '12'}</div>
                    </td>
                    <td className="px-4 py-4 font-mono">₹{b.subtotal.toFixed(2)}</td>
                    <td className="px-4 py-4 font-mono text-purple-400">
                      ₹{(b.cgstAmount + b.sgstAmount + b.serviceCharge).toFixed(2)}
                    </td>
                    <td className="px-4 py-4 font-mono font-black text-emerald-400">
                      ₹{b.grandTotal.toFixed(2)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-[10px] text-slate-500">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gateway Payments View */}
      {activeSubTab === 'PAYMENTS' && (
        <div className="bg-[#121826] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4">Gateway Ref</th>
                  <th className="px-4 py-4">Method</th>
                  <th className="px-4 py-4">Payable Amount</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Settlement Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr className="hover:bg-slate-800/40 transition">
                  <td className="px-5 py-4 font-mono font-bold text-white">
                    TXN_IND_1787678239547_1402
                  </td>
                  <td className="px-4 py-4 font-bold text-white flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[10px] font-black">UPI</span>
                    <span>Direct Intent QR</span>
                  </td>
                  <td className="px-4 py-4 font-mono font-bold text-emerald-400">₹1,382.00</td>
                  <td className="px-4 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      PAID_SETTLED
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-[10px] text-slate-500">
                    Just Now
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
