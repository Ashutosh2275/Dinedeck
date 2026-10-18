import React, { useState } from 'react';
import { ShieldAlert, X, CheckCircle2, ArrowRight, Loader2, KeyRound, Building2, Phone, Mail, HelpCircle } from 'lucide-react';

interface AccountRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountRecoveryModal: React.FC<AccountRecoveryModalProps> = ({ isOpen, onClose }) => {
  const [identifier, setIdentifier] = useState('');
  const [restaurantReference, setRestaurantReference] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please provide your registered email or mobile number.');
      return;
    }
    if (!restaurantReference.trim()) {
      setError('Please provide your restaurant name or identifier.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/account-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          restaurantReference: restaurantReference.trim(),
          ownerName: ownerName.trim(),
          contactPhone: contactPhone.trim(),
          description: description.trim()
        })
      });

      const res = await response.json();
      if (res.success && res.ticketNumber) {
        setTicketNumber(res.ticketNumber);
      } else {
        setError(res.message || 'Unable to submit recovery request. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error reaching DineDeck authentication service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTicketNumber(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 selection:bg-orange-500">
      <div className="bg-[#1E293B] border border-slate-700/90 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0 shadow-md shadow-orange-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                Account Access & Login Recovery
              </h3>
              <p className="text-xs text-slate-400">
                Official Super Admin Security & Credentials Escalation Desk
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {ticketNumber ? (
          /* Success Screen */
          <div className="space-y-4 py-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-white">Recovery Request Registered</h4>
              <p className="text-xs text-slate-300">
                Your incident ticket has been queued directly to the Super Admin Security Team.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 text-center space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Tracking Reference Number
              </div>
              <div className="text-xl font-mono font-black text-emerald-400">
                #{ticketNumber}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800 text-left space-y-1.5 text-xs text-slate-300">
              <div className="font-extrabold text-white flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-orange-400" />
                What happens next?
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                An authorized DineDeck security officer will verify your commercial GSTIN / FSSAI onboarding records and reach out via your registered contact details with a secure single-use access link.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-orange-500/20 cursor-pointer"
            >
              Return to Login
            </button>
          </div>
        ) : (
          /* Request Form */
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <p className="text-xs text-slate-300 leading-relaxed">
              If you cannot access your restaurant owner or general manager account, enter your commercial reference below to initiate a verified identity recovery.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Registered Email or Phone *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="owner@restaurant.in"
                    required
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Restaurant Name or ID *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={restaurantReference}
                    onChange={(e) => setRestaurantReference(e.target.value)}
                    placeholder="e.g. Punjab Heritage Grill"
                    required
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Owner / Applicant Name
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Harpreet Singh"
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Direct Callback Mobile
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Reason / Failure Details
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue (e.g. lost two-factor device, forgotten master password, lockout)..."
                rows={2}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition resize-none"
              />
            </div>

            <div className="pt-1 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Recovery Ticket</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
