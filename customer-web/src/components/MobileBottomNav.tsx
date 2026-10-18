import React from 'react';
import { useCustomer } from '../context/CustomerContext';
import { QrCode, Clock } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { activeView, setActiveView, currentOrder, setShowQrScannerModal, session, cart } = useCustomer();

  // Hide floating action when viewing tracking, bill, account, or browsing menu with items in cart
  if (
    activeView === 'TRACKING' ||
    activeView === 'BILL' ||
    activeView === 'ACCOUNT' ||
    (activeView === 'MENU' && cart.length > 0)
  ) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-5 left-0 right-0 z-40 flex flex-col items-center justify-center pointer-events-none px-4 safe-bottom">
      {/* Active Order Pill if customer has a live order placed */}
      {currentOrder && (
        <button
          type="button"
          onClick={() => setActiveView('TRACKING')}
          className="pointer-events-auto mb-2.5 px-4 py-1.5 rounded-full bg-[#151D30]/95 backdrop-blur-xl border border-emerald-500/40 text-white font-extrabold text-[11px] shadow-xl shadow-black/50 flex items-center gap-2 transform active:scale-95 transition cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Active Order #{currentOrder.orderNumber} • Live Status</span>
        </button>
      )}

      {/* Centered Floating Scan Table QR Button */}
      <button
        type="button"
        onClick={() => setShowQrScannerModal(true)}
        className="pointer-events-auto flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white font-black text-sm shadow-2xl shadow-orange-500/50 border border-white/30 transform active:scale-95 hover:scale-105 transition cursor-pointer select-none ring-4 ring-black/40 min-h-[48px]"
        title="Scan Table QR Code"
      >
        <div className="w-6 h-6 rounded-lg bg-black/20 flex items-center justify-center">
          <QrCode className="w-4 h-4 text-white" />
        </div>
        <span className="tracking-wide">Scan Table QR</span>
      </button>
    </div>
  );
};

