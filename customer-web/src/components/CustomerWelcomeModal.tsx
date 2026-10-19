import React, { useState, useEffect } from 'react';
import { useCustomer } from '../context/CustomerContext';
import {
  X,
  ArrowRight,
  Receipt,
  UtensilsCrossed,
  Clock,
  Sparkles,
  UserPlus,
  LogIn
} from 'lucide-react';

const WELCOME_DISMISSED_KEY = 'dinedeck_welcome_dismissed';

export const CustomerWelcomeModal: React.FC = () => {
  const { user, openAuthModal } = useCustomer();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only display prompt if user is not already logged in AND hasn't dismissed it
    try {
      const isDismissed = localStorage.getItem(WELCOME_DISMISSED_KEY);
      if (!user && !isDismissed) {
        // Small delay so page renders smoothly first without aggressive jarring popup
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [user]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(WELCOME_DISMISSED_KEY, 'true');
    } catch {}
    setIsOpen(false);
  };

  const handleLogin = () => {
    handleDismiss();
    openAuthModal('SIGN_IN');
  };

  const handleRegister = () => {
    handleDismiss();
    openAuthModal('REGISTER');
  };

  if (!isOpen || user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside to dismiss gracefully */}
      <div className="absolute inset-0" onClick={handleDismiss} />

      {/* Modal / Mobile Bottom Sheet Card */}
      <div className="relative w-full sm:max-w-md bg-[#121824] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/80 space-y-6 z-10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Top Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          title="Dismiss welcome message"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Emblem & Welcome Header */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-[#0B1120] border border-orange-500/40 p-2.5 shadow-xl shadow-orange-500/25 flex items-center justify-center">
              <img
                src="/dinedeck-emblem.png"
                alt="DineDeck"
                className="w-full h-full object-contain"
                draggable={false}
              />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-orange-500/20 blur-md pointer-events-none -z-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Welcome to DineDeck
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
              Sign in to see your orders and manage your account.
            </p>
          </div>
        </div>

        {/* Benefits List */}
        <div className="space-y-2.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white">Live Orders & Status History</div>
              <p className="text-[11px] text-slate-400">Track table service and order progress in real-time.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Receipt className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white">Digital Tax Receipts & History</div>
              <p className="text-[11px] text-slate-400">Review past dining bills and itemized invoices anytime.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <UtensilsCrossed className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white">Custom Spice & Dietary Taste</div>
              <p className="text-[11px] text-slate-400">Save kitchen preferences so food is cooked just right.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* Primary: Log In */}
          <button
            type="button"
            onClick={handleLogin}
            className="w-full py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 transition cursor-pointer transform active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>Log in</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          {/* Secondary: Create Account */}
          <button
            type="button"
            onClick={handleRegister}
            className="w-full py-2.5 sm:py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-200 hover:text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5 text-orange-400" />
            <span>Create account</span>
          </button>

          {/* Tertiary: Continue as Guest */}
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition text-center cursor-pointer"
          >
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  );
};
