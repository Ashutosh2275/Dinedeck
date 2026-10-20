import React from 'react';
import { useCustomer } from '../context/CustomerContext';
import { Download, QrCode, User } from 'lucide-react';

export const Header: React.FC = () => {
  const { setActiveView, setShowQrScannerModal, user, openAuthModal } = useCustomer();

  return (
    <header className="h-16 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-3 sm:px-6 sticky top-0 z-30 flex items-center justify-between shadow-sm transition-colors duration-150">
      {/* Clean Brand Identity */}
      <div
        onClick={() => setActiveView('HOME')}
        className="flex items-center cursor-pointer select-none group shrink-0 py-1"
        title="DineDeck Home"
      >
        <img
          src="/dinedeck-logo.png"
          alt="DineDeck"
          className="h-7 sm:h-8 object-contain transform active:scale-95 group-hover:opacity-95 transition"
          draggable={false}
        />
      </div>

      {/* Top Right Controls: Account/Login + Scanner (Desktop only) + Download App */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* User Account / Log in Pill */}
        {user ? (
          <button
            type="button"
            onClick={() => setActiveView('ACCOUNT')}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700/80 hover:border-orange-500/60 transition flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-sm active:scale-95"
            title="My DineDeck Account & Orders"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[65px] sm:max-w-[120px] truncate">
              {user.name ? user.name.split(' ')[0] : 'Account'}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal('SIGN_IN')}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700/80 hover:border-orange-500/60 text-slate-800 hover:text-orange-600 dark:text-slate-200 dark:hover:text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 text-xs font-bold"
            title="Sign in to see orders and account"
          >
            <User className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400 shrink-0" />
            <span>Log in</span>
          </button>
        )}

        {/* Scan QR Button (Hidden on mobile screens, shown on desktop) */}
        <button
          type="button"
          onClick={() => setShowQrScannerModal(true)}
          className="hidden md:flex px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 text-orange-500 dark:text-orange-400 border border-slate-300 dark:border-slate-700/80 transition items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          title="Scan Table QR Code"
        >
          <QrCode className="w-4 h-4 text-orange-500 dark:text-orange-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Scan QR</span>
        </button>

        {/* Download App Button */}
        <a
          href="/dinedeck-customer.apk"
          download="dinedeck-customer.apk"
          className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer transform active:scale-95 shrink-0"
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
