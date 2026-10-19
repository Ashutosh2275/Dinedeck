import React, { useState, useEffect } from 'react';
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
  UtensilsCrossed,
  AlertTriangle,
  XCircle,
  RotateCcw,
  PhoneCall,
  Store,
  Hourglass
} from 'lucide-react';

export const CustomerTracking: React.FC = () => {
  const {
    session,
    currentOrder,
    sessionOrders,
    setActiveView,
    setShowQrScannerModal,
    setShowServiceModal,
    addToCart
  } = useCustomer();

  const activeOrder = currentOrder || sessionOrders[0] || null;
  const status = (activeOrder?.status || 'PLACED').toUpperCase();

  // 90-Second Acceptance Countdown Calculation
  const calculateRemainingSeconds = (): number => {
    if (!activeOrder || status !== 'PLACED') return 0;
    const now = Date.now();
    if (activeOrder.acceptanceDeadline) {
      const deadline = new Date(activeOrder.acceptanceDeadline).getTime();
      return Math.max(0, Math.floor((deadline - now) / 1000));
    }
    if (activeOrder.createdAt) {
      const created = new Date(activeOrder.createdAt).getTime();
      const elapsed = Math.floor((now - created) / 1000);
      return Math.max(0, 90 - elapsed);
    }
    return 90;
  };

  const [remainingSeconds, setRemainingSeconds] = useState<number>(calculateRemainingSeconds);

  useEffect(() => {
    if (status !== 'PLACED') return;
    setRemainingSeconds(calculateRemainingSeconds());

    const interval = setInterval(() => {
      const sec = calculateRemainingSeconds();
      setRemainingSeconds(sec);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeOrder?.id, activeOrder?.acceptanceDeadline, status]);

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

  // Reorder helper: adds existing items back into cart and redirects to menu
  const handleReorder = () => {
    if (activeOrder?.items) {
      for (const item of activeOrder.items) {
        addToCart({
          id: item.menuItemId || item.id || '',
          name: item.name,
          description: '',
          price: item.unitPrice,
          imageUrl: '',
          isVeg: true,
          isAvailable: true,
          preparationTime: 15
        });
      }
    }
    setActiveView('MENU');
  };

  // If no order is placed yet, prompt to Scan QR or view menu
  if (!activeOrder) {
    return (
      <div className="space-y-6 pb-28 max-w-xl mx-auto text-center p-8 bg-white dark:bg-[#151D30] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl">
        <div className="w-16 h-16 rounded-3xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center mx-auto text-orange-500 dark:text-orange-400">
          <QrCode className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">No Active Table Order</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
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
            className="px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs transition border border-slate-300 dark:border-slate-700 inline-flex items-center justify-center space-x-2 cursor-pointer"
          >
            <UtensilsCrossed className="w-4 h-4 text-orange-500" />
            <span>Browse Live Menu</span>
          </button>
        </div>
      </div>
    );
  }

  const isTimeout =
    (activeOrder as any)?.rejectionReasonCode === 'ACCEPTANCE_TIMEOUT' ||
    (status === 'REJECTED' && String((activeOrder as any)?.rejectionReason || '').toLowerCase().includes('90 seconds'));

  const countdownMinutes = Math.floor(remainingSeconds / 60);
  const countdownSec = remainingSeconds % 60;
  const formattedCountdown = `${String(countdownMinutes).padStart(2, '0')}:${String(countdownSec).padStart(2, '0')}`;

  return (
    <div className="space-y-6 pb-28 max-w-4xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. TOP LIVE STATUS HERO BANNER                                            */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-tr from-white to-slate-50 dark:from-[#151D30] dark:to-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 font-extrabold text-xs">
              Table #{session.tableNumber || '1'}
            </span>
            <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
              {activeOrder?.orderNumber || '#ORD-LIVE'}
            </span>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-black border ${
              status === 'PLACED'
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30 animate-pulse'
                : status === 'REJECTED'
                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
            }`}
          >
            {status === 'PLACED' ? 'WAITING FOR RESTAURANT' : status}
          </span>
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {status === 'PLACED'
              ? 'Order Sent to Kitchen'
              : status === 'REJECTED'
              ? 'Order Could Not Be Prepared'
              : 'Live Kitchen Progress'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {status === 'PLACED'
              ? 'The restaurant is reviewing your ticket for automatic station routing.'
              : status === 'REJECTED'
              ? 'Please see the reason and options below to continue dining.'
              : 'Your dishes are synchronized live with kitchen display systems.'}
          </p>
        </div>

        {/* 90-Second Acceptance Countdown (Shown when status is PLACED) */}
        {status === 'PLACED' && (
          <div className="p-4 bg-orange-500/10 dark:bg-orange-500/15 rounded-2xl border border-orange-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/30 animate-pulse shrink-0">
                <Hourglass className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                  Restaurant Acceptance Window
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                  The restaurant must accept your order within 90 seconds.
                </div>
              </div>
            </div>

            <div className="px-3.5 py-1.5 rounded-xl bg-orange-600 dark:bg-orange-500 text-white font-mono font-black text-sm tracking-widest shadow-md flex items-center space-x-1.5 shrink-0">
              <Clock className="w-4 h-4 animate-spin" />
              <span>Waiting for restaurant · {formattedCountdown}</span>
            </div>
          </div>
        )}

        {/* Estimated ETA (Shown when accepted/cooking) */}
        {status !== 'PLACED' && status !== 'REJECTED' && (
          <div className="p-3 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
              <Clock className="w-4 h-4 text-amber-500 animate-spin" />
              <span className="font-semibold">Estimated Serving Time</span>
            </div>
            <span className="font-black text-orange-600 dark:text-orange-400">~10-15 Mins</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. REJECTION & TIMEOUT NOTICE (High Contrast WCAG 2.2 AA Compliant)        */}
      {/* ========================================================================= */}
      {status === 'REJECTED' && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500/60 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <XCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center space-x-2 flex-wrap">
                <h3 className="text-base font-black text-rose-700 dark:text-rose-300">
                  {isTimeout ? 'Order Acceptance Timed Out' : 'Order Declined by Restaurant'}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                  {(activeOrder as any)?.rejectionReasonCode || (isTimeout ? 'ACCEPTANCE_TIMEOUT' : 'DECLINED')}
                </span>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                {isTimeout
                  ? 'The restaurant did not accept your order within 90 seconds. Please try another restaurant or place your order again.'
                  : (activeOrder as any)?.rejectionReason ||
                    (activeOrder as any)?.remarks ||
                    'The kitchen is currently unable to accept this order due to operational capacity.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={handleReorder}
              className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-500 active:scale-[0.98] text-white text-xs font-black rounded-xl transition shadow-lg shadow-orange-600/25 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reorder Dishes</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('HOME')}
              className="flex-1 py-3 px-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Store className="w-4 h-4 text-orange-500" />
              <span>Try Another Restaurant</span>
            </button>

            <button
              type="button"
              onClick={() => setShowServiceModal(true)}
              className="py-3 px-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 text-emerald-500" />
              <span>Call Server</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ORDER STATE LIFECYCLE STEPPER                                          */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#151D30] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Order State Lifecycle
        </h3>

        <div className="space-y-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < currentStepIdx && status !== 'REJECTED';
            const isCurrent = idx === currentStepIdx && status !== 'REJECTED';

            return (
              <div key={step.key} className="flex items-start space-x-4 relative">
                {idx < steps.length - 1 && (
                  <div
                    className={`absolute left-4 top-8 bottom-0 w-0.5 -ml-[1px] ${
                      isCompleted ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}

                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition z-10 ${
                    isCurrent
                      ? 'bg-orange-500 border-white text-white shadow-lg shadow-orange-500/40 animate-pulse'
                      : isCompleted
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="pt-1 min-w-0">
                  <div
                    className={`text-sm font-black ${
                      isCurrent
                        ? 'text-orange-600 dark:text-orange-400'
                        : isCompleted
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ITEMIZED ORDER DISHES SUMMARY                                          */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#151D30] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Ordered Dishes in this Ticket
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {(activeOrder?.items || []).map((item: any, i: number) => (
            <div key={i} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 text-orange-600 dark:text-orange-400 font-bold flex items-center justify-center text-[10px]">
                  {item.quantity}x
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{item.name}</span>
              </div>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                ₹{(item.totalPrice || item.unitPrice * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveView('MENU')}
            className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add More Dishes</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('BILL')}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-emerald-500" />
            <span>View Running Bill</span>
          </button>
        </div>
      </div>
    </div>
  );
};
