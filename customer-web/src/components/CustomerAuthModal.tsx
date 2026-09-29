import React, { useState } from 'react';
import { useCustomer } from '../context/CustomerContext';
import {
  Mail,
  Lock,
  Phone,
  User,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  UtensilsCrossed,
  Eye,
  EyeOff
} from 'lucide-react';

export const CustomerAuthModal: React.FC = () => {
  const {
    showAuthModal,
    setShowAuthModal,
    loginCustomer,
    loginWithPhone,
    registerCustomer,
    sendPasswordResetLink,
    resetPassword,
    onAuthSuccess
  } = useCustomer();

  // Primary mode: 'SIGN_IN' | 'REGISTER' | 'FORGOT_PASSWORD'
  const [tab, setTab] = useState<'SIGN_IN' | 'REGISTER' | 'FORGOT_PASSWORD'>('SIGN_IN');
  // Login method toggle: 'EMAIL' | 'PHONE'
  const [loginMethod, setLoginMethod] = useState<'EMAIL' | 'PHONE'>('EMAIL');

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 98201 23456');
  const [email, setEmail] = useState('alex.vance@dinedeck.io');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('alex.vance@dinedeck.io');
  const [resetLinkSent, setResetLinkSent] = useState(false);
  const [resetLinkMsg, setResetLinkMsg] = useState('');
  const [showNewPasswordForm, setShowNewPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!showAuthModal) return null;

  // Handle Sign In (Email or Phone)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (loginMethod === 'EMAIL') {
        if (!email.trim() || !email.includes('@')) {
          setError('Please enter a valid email address');
          setIsSubmitting(false);
          return;
        }
        const res = await loginCustomer(email.trim(), password);
        if (res.success) {
          setShowAuthModal(false);
          if (onAuthSuccess) onAuthSuccess();
        } else {
          setError(res.message || 'Invalid email or password');
        }
      } else {
        if (!phone.trim()) {
          setError('Please enter your mobile number');
          setIsSubmitting(false);
          return;
        }
        const res = await loginWithPhone(phone.trim(), password);
        if (res.success) {
          setShowAuthModal(false);
          if (onAuthSuccess) onAuthSuccess();
        } else {
          setError('Invalid mobile number or password');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Registration (strictly 4 fields: Name, Phone, Email, Password)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all 4 fields (Full Name, Phone Number, Email, Password)');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await registerCustomer(name.trim(), phone.trim(), email.trim(), password);
      if (res.success) {
        setShowAuthModal(false);
        if (onAuthSuccess) onAuthSuccess();
      } else {
        setError(res.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Registration error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Send Password Reset Link
  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setError('Please enter a valid email address to receive reset link');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await sendPasswordResetLink(forgotEmail.trim());
      if (res.success) {
        setResetLinkSent(true);
        setResetLinkMsg(res.message);
      } else {
        setError(res.message || 'Failed to dispatch reset link');
      }
    } catch (err: any) {
      setError(err.message || 'Error requesting reset link');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Save New Password
  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await resetPassword(forgotEmail.trim(), newPassword);
      if (res.success) {
        setPassword(newPassword);
        setSuccessMsg(res.message);
        setShowNewPasswordForm(false);
        setResetLinkSent(false);
        setTab('SIGN_IN');
      } else {
        setError(res.message || 'Failed to update password');
      }
    } catch (err: any) {
      setError(err.message || 'Could not reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={() => setShowAuthModal(false)}
      className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#151D30] border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 cursor-default text-left"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {tab === 'REGISTER'
                  ? 'Create Account'
                  : tab === 'FORGOT_PASSWORD'
                  ? 'Reset Password'
                  : 'Welcome Back'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {tab === 'REGISTER'
                  ? 'Join DineDeck for smart in-restaurant dining'
                  : tab === 'FORGOT_PASSWORD'
                  ? 'Enter your email to receive a password reset link'
                  : 'Sign in to access your DineDeck dining account'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAuthModal(false)}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. SIGN IN TAB */}
        {tab === 'SIGN_IN' && (
          <div className="space-y-4">
            {/* Dual Mode Switcher: Email vs Phone */}
            <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('EMAIL');
                  setError('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  loginMethod === 'EMAIL'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginMethod('PHONE');
                  setError('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  loginMethod === 'PHONE'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Phone Number</span>
              </button>
            </div>

            <form onSubmit={handleSignIn} className="space-y-3.5">
              {loginMethod === 'EMAIL' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-orange-400" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="name@example.com"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition shadow-inner font-mono"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-orange-400" />
                    <span>Mobile Number</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setError('');
                    }}
                    placeholder="+91 98201 23456"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition shadow-inner font-mono"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-orange-400" />
                    <span>Password</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setResetLinkSent(false);
                      setShowNewPasswordForm(false);
                      setError('');
                      setTab('FORGOT_PASSWORD');
                    }}
                    className="text-[11px] font-bold text-orange-400 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="••••••••••••"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 pr-10 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-black rounded-2xl text-xs transition shadow-xl shadow-orange-500/25 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setTab('REGISTER');
                  }}
                  className="text-xs font-bold text-orange-400 hover:underline cursor-pointer"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 2. REGISTER TAB (Strictly 4 fields: Name, Phone, Email, Password) */}
        {tab === 'REGISTER' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            {/* 1. Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-orange-400" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="e.g. Rahul Sharma"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition shadow-inner"
              />
            </div>

            {/* 2. Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-orange-400" />
                <span>Phone Number</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError('');
                }}
                placeholder="+91 98201 23456"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition shadow-inner font-mono"
              />
            </div>

            {/* 3. Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-orange-400" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="name@example.com"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition shadow-inner font-mono"
              />
            </div>

            {/* 4. Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-orange-400" />
                <span>Password</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="At least 6 characters"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-black rounded-2xl text-xs transition shadow-xl shadow-orange-500/25 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Creating Account...' : 'Register'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-400">Already have an account? </span>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setTab('SIGN_IN');
                }}
                className="text-xs font-bold text-orange-400 hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* 3. FORGOT PASSWORD (Email Reset Link Flow) */}
        {tab === 'FORGOT_PASSWORD' && (
          <div className="space-y-4">
            {resetLinkSent && !showNewPasswordForm ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Reset Link Dispatched!</p>
                    <p className="text-[11px] text-emerald-300/90 mt-0.5">{resetLinkMsg}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300">
                  A secure link has been sent to your inbox. Click below to simulate opening the link from your email:
                </p>

                <button
                  type="button"
                  onClick={() => setShowNewPasswordForm(true)}
                  className="w-full py-3 rounded-2xl bg-orange-500/15 border border-orange-500/40 text-orange-400 hover:bg-orange-500/25 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Open Email Reset Link</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTab('SIGN_IN');
                    setError('');
                  }}
                  className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition font-bold cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            ) : showNewPasswordForm ? (
              <form onSubmit={handleSaveNewPassword} className="space-y-3.5">
                <p className="text-xs text-slate-300">
                  Enter your new password for <span className="text-orange-400 font-bold">{forgotEmail}</span>:
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-orange-400" />
                    <span>New Password</span>
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-black rounded-2xl text-xs transition shadow-xl shadow-orange-500/25 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Updating...' : 'Save New Password'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleSendResetLink} className="space-y-3.5">
                <p className="text-xs text-slate-300">
                  Enter your registered email address and we'll send you a link to reset your password.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-orange-400" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition shadow-inner font-mono"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTab('SIGN_IN');
                      setError('');
                    }}
                    className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-black rounded-2xl text-xs transition shadow-xl shadow-orange-500/25 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{isSubmitting ? 'Sending...' : 'Send Reset Link'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
