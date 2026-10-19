import React, { useState, useEffect } from 'react';
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
import { OrderCountdownBadge } from './OrderCountdownBadge';
import { OrderRejectionModal } from './OrderRejectionModal';

interface IncomingOrderModalProps {
  order: Order | null;
  onAccept: (orderId: string) => Promise<void>;
  onReject: (orderId: string, reason: string, reasonCode?: string, customReason?: string) => Promise<void>;
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
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [now, setNow] = useState<number>(Date.now());

  // 1-second cadence timer to guarantee exact real-time expiry sync
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const deadlineTime = order?.acceptanceDeadline
    ? new Date(order.acceptanceDeadline).getTime()
    : order?.createdAt
    ? new Date(order.createdAt).getTime() + 90 * 1000
    : 0;

  const isExpired = Boolean(
    order &&
      ((deadlineTime > 0 && now >= deadlineTime) ||
        order.status === 'REJECTED' ||
        order.status === 'CANCELLED')
  );

  // Auto-dismiss once expired after brief countdown feedback (3 seconds)
  useEffect(() => {
    if (isExpired && order) {
      const dismissTimer = setTimeout(() => {
        onDismiss();
      }, 3500);
      return () => clearTimeout(dismissTimer);
    }
  }, [isExpired, order, onDismiss]);

  if (!order) return null;

  const handleAccept = async () => {
    if (isExpired || isProcessing) return;
    setIsProcessing(true);
    try {
      await onAccept(order.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmRejection = async (payload: {
    reasonCode: string;
    reason: string;
    customReason?: string;
  }) => {
    setIsProcessing(true);
    try {
      await onReject(order.id, payload.reason, payload.reasonCode, payload.customReason);
      setShowRejectModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const itemCount = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 pt-20 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-[#111827] border-2 border-orange-500 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl shadow-orange-500/20 text-slate-900 dark:text-white relative">
          {/* Header Row */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                  isExpired
                    ? 'bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/30'
                    : 'bg-orange-500 text-white shadow-orange-500/30 animate-pulse'
                }`}
              >
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-sm font-black uppercase tracking-wider ${
                      isExpired ? 'text-rose-500 dark:text-rose-400' : 'text-orange-500 dark:text-orange-400'
                    }`}
                  >
                    {isExpired ? 'ACCEPTANCE EXPIRED' : 'NEW INCOMING ORDER'}
                  </span>
                  {!isExpired && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                </div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Table #{order.tableNumber} • {order.orderNumber}
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <OrderCountdownBadge
                createdAt={order.createdAt}
                acceptanceDeadline={order.acceptanceDeadline}
                onExpire={() => {
                  // Instant expiration trigger
                  setNow(Date.now() + 1000);
                }}
              />
              <button
                onClick={onDismiss}
                disabled={isProcessing}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer"
                title="Dismiss Dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Dishes Breakdown List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              <span>Dishes ({itemCount} items)</span>
              <span>Total: ₹{order.totalAmount?.toFixed(2) || '0.00'}</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 space-y-2 max-h-48 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800/80">
              {order.items?.map((item, idx) => (
                <div key={idx} className="pt-2 first:pt-0 flex items-start justify-between text-xs">
                  <div className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-lg bg-orange-500/15 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      {item.quantity}x
                    </span>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{item.name}</div>
                      {item.variantName && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Variant: {item.variantName}</div>
                      )}
                      {item.kitchenNotes && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 italic">"{item.kitchenNotes}"</div>
                      )}
                    </div>
                  </div>

                  <span className="font-mono font-bold text-slate-800 dark:text-slate-300">
                    ₹{(item.totalPrice || item.unitPrice * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {order.specialNotes && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-700 dark:text-amber-300 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Table Notes: </span>
                <span>{order.specialNotes}</span>
              </div>
            </div>
          )}

          {/* Expired Status Notice */}
          {isExpired && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-xs text-rose-600 dark:text-rose-300 flex items-center space-x-2 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>
                90-second acceptance timeout reached. Order cannot be accepted and is auto-rejected.
              </span>
            </div>
          )}

          {/* Primary Actions */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleAccept}
              disabled={isProcessing || isExpired}
              className={`w-full py-3.5 font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center space-x-2 ${
                isExpired
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 active:scale-[0.98] cursor-pointer'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {isExpired
                  ? 'Acceptance Expired (Cannot Accept)'
                  : isProcessing
                  ? 'Accepting...'
                  : 'Accept Order'}
              </span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                disabled={isProcessing || isExpired}
                className={`py-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center space-x-1.5 ${
                  isExpired
                    ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                    : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-500/30 cursor-pointer'
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Reject Order</span>
              </button>

              <button
                type="button"
                onClick={onOpenKds}
                disabled={isProcessing}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs border border-slate-200 dark:border-slate-700 transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <ChefHat className="w-3.5 h-3.5 text-orange-500" />
                <span>Open in KDS</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Quick Order Rejection Modal */}
      <OrderRejectionModal
        isOpen={showRejectModal}
        orderNumber={order.orderNumber}
        tableNumber={order.tableNumber}
        isSubmitting={isProcessing}
        onConfirm={handleConfirmRejection}
        onCancel={() => setShowRejectModal(false)}
      />
    </>
  );
};
