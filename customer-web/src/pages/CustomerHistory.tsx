import React, { useState } from 'react';
import { useCustomer } from '../context/CustomerContext';
import { OfflineReceipt } from '../types';
import {
  History,
  Receipt,
  Download,
  Calendar,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Printer
} from 'lucide-react';

export const CustomerHistory: React.FC = () => {
  const { offlineReceipts, setActiveView } = useCustomer();
  const [selectedReceipt, setSelectedReceipt] = useState<OfflineReceipt | null>(null);

  return (
    <div className="space-y-6 pb-24 max-w-lg mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveView('MENU')}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-black text-white">Dining Receipts & History</h2>
            <div className="text-[11px] text-slate-400">Offline-available immutable copies</div>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30">
          {offlineReceipts.length} Saved
        </span>
      </div>

      {offlineReceipts.length === 0 ? (
        <div className="bg-[#151D30] border border-slate-800 rounded-3xl p-10 text-center space-y-3">
          <History className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-sm font-bold text-white">No Saved Receipts Yet</div>
          <p className="text-xs text-slate-400">
            Whenever you complete and settle a table bill, an immutable copy is preserved here for your offline records.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {offlineReceipts.map((rcpt) => (
            <div
              key={rcpt.receiptId}
              onClick={() => setSelectedReceipt(rcpt)}
              className="bg-[#151D30] hover:bg-slate-800/80 border border-slate-800 hover:border-orange-500/50 rounded-3xl p-5 shadow-lg cursor-pointer transition space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-white">{rcpt.restaurantName}</div>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(rcpt.paidAt || Date.now()).toLocaleDateString()}</span>
                    <span>• Table #{rcpt.tableNumber}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-orange-400 font-mono">
                    ₹{rcpt.grandTotal.toFixed(2)}
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 uppercase">
                    PAID ({rcpt.paymentMethod})
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="font-mono text-[10px] text-slate-500">{rcpt.orderNumber || rcpt.billId}</span>
                <span className="text-orange-400 font-bold">View Tax Invoice →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Offline Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151D30] border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-orange-400" />
                <h3 className="text-sm font-black text-white">Immutable Offline Receipt</h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1">
                <div className="font-black text-white text-sm">{selectedReceipt.restaurantName}</div>
                <div className="text-slate-400">Table #{selectedReceipt.tableNumber} • Guest: {selectedReceipt.customerName}</div>
                <div className="text-[10px] font-mono text-slate-500">Ref: {selectedReceipt.receiptId} • Method: {selectedReceipt.paymentMethod}</div>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Food Subtotal</span>
                  <span className="font-mono">₹{selectedReceipt.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Taxes (GST 5%)</span>
                  <span className="font-mono">₹{selectedReceipt.taxTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Service Charge (5%)</span>
                  <span className="font-mono">₹{selectedReceipt.serviceCharge.toFixed(2)}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-700 flex justify-between font-black text-white text-sm">
                  <span>Settled Grand Total</span>
                  <span className="text-orange-400 font-mono text-base">₹{selectedReceipt.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-2xl text-xs transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-orange-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download Tax Receipt</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

