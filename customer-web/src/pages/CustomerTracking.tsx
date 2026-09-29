import React from 'react';
import { useCustomer } from '../context/CustomerContext';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Utensils,
  Plus,
  Receipt,
  ArrowRight,
  Flame,
  QrCode,
  UtensilsCrossed
} from 'lucide-react';

export const CustomerTracking: React.FC = () => {
  const { session, currentOrder, sessionOrders, setActiveView, setShowQrScannerModal } = useCustomer();

  const activeOrder = currentOrder || sessionOrders[0] || null;
  const status = (activeOrder?.status || 'PLACED').toUpperCase();

  const steps = [
    { key: 'PLACED', label: 'Order Received', icon: CheckCircle2, desc: 'Ticket registered in dining system' },
    { key: 'CONFIRMED', label: 'Kitchen Accepted', icon: ChefHat, desc: 'Head chef assigned station' },
    { key: 'PREPARING', label: 'Cooking on Fire', icon: Flame, desc: 'Tandoor & curry stations active' },
    { key: 'READY', label: 'Food Ready', icon: Utensils, desc: 'Garnished & plated for server' },
    { key: 'SERVED', label: 'Served to Table', icon: CheckCircle2, desc: `Delivered to Table #${session.tableNumber || '1'}` }
  ];

  const getStepIndex = (st: string) => {
    if (st === 'PLACED') return 0;
    if (st === 'ACCEPTED' || st === 'CONFIRMED') return 1;
    if (st === 'PREPARING') return 2;
    if (st === 'READY') return 3;
    if (st === 'SERVED' || st === 'COMPLETED') return 4;
    return 0;
  };

  const currentStepIdx = getStepIndex(status);

  // If no order is placed yet, prompt to Scan QR or view menu
  if (!activeOrder) {
    return (
      <div className="space-y-6 pb-28 max-w-xl mx-auto text-center p-8 bg-[#151D30] border border-slate-800 rounded-3xl shadow-xl">
        <div className="w-16 h-16 rounded-3xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center mx-auto text-orange-400">
          <QrCode className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-black text-white">No Active Table Order</h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {session.tableNumber
              ? `You are connected at Table #${session.tableNumber}. Browse the live menu to place dishes with the kitchen.`
              : 'Scan your table QR code to pair your session and track real-time kitchen preparation.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
          <button
            type="button"
            onClick={() => setShowQrScannerModal(true)}
            className="px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white font-black rounded-2xl text-xs transition shadow-lg shadow-orange-500/20 inline-flex items-center justify-center space-x-2 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan Table QR</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('MENU')}
            className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs transition border border-slate-700 inline-flex items-center justify-center space-x-2 cursor-pointer"
          >
            <UtensilsCrossed className="w-4 h-4 text-orange-400" />
            <span>Browse Live Menu</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-tr from-[#151D30] to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-xl bg-orange-500/20 text-orange-400 font-extrabold text-xs">
              Table #{session.tableNumber || '1'}
            </span>
            <span className="font-mono text-xs font-bold text-slate-300">
              {activeOrder?.orderNumber || '#ORD-LIVE'}
            </span>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            {status}
          </span>
        </div>

        <div>
          <h2 className="text-xl font-black text-white">Live Kitchen Progress</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Your dishes are synchronized live with kitchen display systems.
          </p>
        </div>

        {/* Estimated ETA */}
        <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <Clock className="w-4 h-4 text-amber-400 animate-spin" />
            <span className="font-semibold">Estimated Serving Time</span>
          </div>
          <span className="font-black text-orange-400">~10-15 Mins</span>
        </div>
      </div>

      {status === 'REJECTED' && (
        <div className="bg-rose-950/40 border border-rose-500/50 rounded-3xl p-5 shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm">
            <span>❌ Order Rejected by Kitchen</span>
          </div>
          <p className="text-xs text-slate-300">
            {(activeOrder as any)?.rejectionReason || (activeOrder as any)?.remarks || 'The kitchen was unable to accept this order at this time. Please check with your floor captain or re-order.'}
          </p>
        </div>
      )}

      {/* Realtime Stepper */}
      <div className="bg-[#151D30] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Order State Lifecycle
        </h3>

        <div className="space-y-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;

            return (
              <div key={step.key} className="flex items-start space-x-4 relative">
                {idx < steps.length - 1 && (
                  <div
                    className={`absolute left-4 top-8 bottom-0 w-0.5 -ml-[1px] ${
                      isCompleted ? 'bg-orange-500' : 'bg-slate-800'
                    }`}
                  />
                )}

                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition z-10 ${
                    isCurrent
                      ? 'bg-orange-500 border-white text-white shadow-lg shadow-orange-500/40 animate-pulse'
                      : isCompleted
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="pt-1 min-w-0">
                  <div
                    className={`text-sm font-black ${
                      isCurrent ? 'text-orange-400' : isCompleted ? 'text-white' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-xs text-slate-400">{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Itemized Order Summary */}
      <div className="bg-[#151D30] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Ordered Dishes in this Ticket
        </h3>

        <div className="divide-y divide-slate-800">
          {(activeOrder?.items || []).map((item: any, i: number) => (
            <div key={i} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded bg-slate-800 text-orange-400 font-bold flex items-center justify-center text-[10px]">
                  {item.quantity}x
                </span>
                <span className="font-bold text-white">{item.name}</span>
              </div>
              <span className="font-mono text-slate-300">
                ₹{(item.totalPrice || item.unitPrice * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveView('MENU')}
            className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add More Dishes</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('BILL')}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>View Running Bill</span>
          </button>
        </div>
      </div>
    </div>
  );
};
