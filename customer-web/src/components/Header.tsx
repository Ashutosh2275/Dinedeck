import React from 'react';
import { useCustomer } from '../context/CustomerContext';
import { UtensilsCrossed, Download, QrCode } from 'lucide-react';

export const Header: React.FC = () => {
  const { setActiveView, setShowQrScannerModal } = useCustomer();

  return (
    <header className="h-16 bg-[#121824]/95 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-8 sticky top-0 z-30 flex items-center justify-between shadow-xl">
      {/* Clean Brand Identity */}
      <div
        onClick={() => setActiveView('HOME')}
        className="flex items-center space-x-3 cursor-pointer select-none group"
        title="DINEDECK Home"
      >
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0 transform active:scale-95 group-hover:scale-105 transition">
          <UtensilsCrossed className="w-5 h-5 text-white" />
        </div>

        <span className="font-black text-lg sm:text-xl text-white tracking-tight leading-tight group-hover:text-orange-400 transition">
          DINEDECK
        </span>
      </div>

      {/* Top Right Controls: Scanner (Desktop only) + Download App Option */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowQrScannerModal(true)}
          className="hidden md:flex px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-orange-400 border border-slate-700/80 transition items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          title="Scan Table QR Code"
        >
          <QrCode className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-bold text-slate-200">Scan QR</span>
        </button>

        <a
          href="/dinedeck-customer.apk"
          download="dinedeck-customer.apk"
          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer transform active:scale-95"
          title="Download DineDeck Mobile App"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Download App</span>
          <span className="sm:hidden">App</span>
        </a>
      </div>
    </header>
  );
};
