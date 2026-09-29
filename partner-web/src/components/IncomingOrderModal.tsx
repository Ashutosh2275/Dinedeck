import React, { useState } from 'react';
import { Order } from '../types';
import {
  BellRing,
  ChefHat,
  X,
  CheckCircle2,
  Ban,
  Clock,
  UtensilsCrossed,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';

interface IncomingOrderModalProps {
  order: Order | null;
  onAccept: (orderId: string) => Promise<void>;
  onReject: (orderId: string, reason: string) => Promise<void>;
  onDismiss: () => void;
  onOpenKds: () => void;
}

export const IncomingOrderModal: React.FC<IncomingOrderModalProps> = ({
  order,
  onAccept,
  onReject,
  onDismiss,
  onOpenKds
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showRejectPrompt, setShowRejectPrompt] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('Kitchen at full capacity');

  if (!order) return null;

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await onAccept(order.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setIsProcessing(true);
    try {
      await onReject(order.id, rejectReason.trim());
    } finally {
      setIsProcessing(false);
    }
  };

  const itemCount = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#111827] border-2 border-orange-500 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl shadow-orange-500/20 text-white relative">
        {/* Glowing Indicator Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 animate-pulse">
              <BellRing className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-black text-orange-400 uppercase tracking-wider">
                  NEW INCOMING ORDER
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h2 className="text-base font-black text-white">
                Table #{order.tableNumber} • {order.orderNumber}
              </h2>
            </div>
          </div>

          <button
            onClick={onDismiss}
            disabled={isProcessing}
            className="text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dishes Breakdown List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Dishes ({itemCount} items)</span>
            <span>Total: ₹{order.totalAmount?.toFixed(2) || '0.00'}</span>
          </div>

          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3 space-y-2 max-h-48 overflow-y-auto divide-y divide-slate-800/80">
            {order.items?.map((item, idx) => (
              <div key={idx} className="pt-2 first:pt-0 flex items-start justify-between text-xs">
                <div className="flex items-start space-x-2">
                  <span className="w-5 h-5 rounded-lg bg-orange-500/20 text-orange-400 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {item.quantity}x
                  </span>
                  <div>
                    <div className="font-bold text-slate-200">{item.name}</div>
                    {item.variantName && (
                      <div className="text-[10px] text-slate-400">Variant: {item.variantName}</div>
                    )}
                    {item.kitchenNotes && (
                      <div className="text-[10px] text-amber-400 italic">"{item.kitchenNotes}"</div>
                    )}
                  </div>
                </div>

                <span className="font-mono font-bold text-slate-300">
                  ₹{(item.totalPrice || item.unitPrice * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {order.specialNotes && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Table Notes: </span>
              <span>{order.specialNotes}</span>
            </div>
          </div>
        )}

        {/* Reject Reason Form */}
        {showRejectPrompt ? (
          <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-2xl space-y-3">
            <div className="text-xs font-bold text-rose-400">Select Rejection Reason:</div>
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-slate-900 border border-rose-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="Kitchen at full capacity">Kitchen at full capacity</option>
              <option value="Items out of stock">Items out of stock</option>
              <option value="Restaurant closing soon">Restaurant closing soon</option>
              <option value="Table not occupied / duplicate">Table not occupied / duplicate</option>
            </select>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowRejectPrompt(false)}
                className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isProcessing}
                className="py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/30"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        ) : (
          /* Primary Actions */
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleAccept}
              disabled={isProcessing}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isProcessing ? 'Accepting...' : 'Accept Order'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowRejectPrompt(true)}
                disabled={isProcessing}
                className="py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold rounded-xl text-xs border border-rose-500/30 transition flex items-center justify-center space-x-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Reject Order</span>
              </button>

              <button
                type="button"
                onClick={onOpenKds}
                disabled={isProcessing}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 transition flex items-center justify-center space-x-1.5"
              >
                <ChefHat className="w-3.5 h-3.5 text-orange-400" />
                <span>Open in KDS</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
