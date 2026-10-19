import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UtensilsCrossed, Lock, Mail, ArrowRight, ShieldCheck, Zap, Loader2, AlertCircle, ChefHat, Receipt, Eye, EyeOff, HelpCircle, Sun, Moon } from 'lucide-react';
import { AccountRecoveryModal } from '../components/AccountRecoveryModal';

export const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState<string>('owner.punjab@dinedeck.in');
  const [password, setPassword] = useState<string>('Dinedeck@2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submittingEmail, setSubmittingEmail] = useState<string | null>(null);

  // Smooth Synchronized Animation States
  const logoRef = useRef<HTMLDivElement>(null);
  const [logoTransform, setLogoTransform] = useState<{
    transform: string;
    transition: string;
    isCenter: boolean;
  }>({
    transform: 'none',
    transition: 'none',
    isCenter: true
  });
  const [showContent, setShowContent] = useState(true);
  const [isAnimationComplete, setIsAnimationComplete] = useState(true);

  useEffect(() => {
    // Graceful micro-glide on mount
    if (logoRef.current) {
      setLogoTransform({
        transform: 'none',
        transition: 'all 500ms cubic-bezier(0.16, 1, 0.3, 1)',
        isCenter: false
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your registered staff/owner email address.');
      return;
    }
    setError(null);
    setSubmittingEmail(email.trim());
    try {
      const res = await login(email.trim(), password.trim() || 'Dinedeck@2026');
      if (!res.success) {
        setError(res.message || 'Authentication failed. Please verify the Fastify backend is running on port 8080.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error connecting to http://localhost:8080/api/auth/login');
    } finally {
      setSubmittingEmail(null);
    }
  };

  const quickRoles = [
    {
      id: 'owner',
      title: 'Restaurant Owner',
      desc: 'Punjab Heritage • Full Access',
      icon: '👑',
      email: 'owner.punjab@dinedeck.in',
      tag: 'OWNER',
      accent: 'border-orange-500/30 text-orange-400 bg-orange-500/10 hover:border-orange-500/60'
    },
    {
      id: 'manager',
      title: 'General Manager',
      desc: 'Floor Ops & Staff Lead',
      icon: '👔',
      email: 'manager.sunil@punjabheritage.in',
      tag: 'MANAGER',
      accent: 'border-blue-500/30 text-blue-400 bg-blue-500/10 hover:border-blue-500/60'
    },
    {
      id: 'chef',
      title: 'Head Chef',
      desc: 'Kitchen Display (KDS)',
      icon: '👨‍🍳',
      email: 'chef.vikram@punjabheritage.in',
      tag: 'CHEF',
      accent: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:border-emerald-500/60'
    },
    {
      id: 'waiter',
      title: 'Floor Captain',
      desc: 'Table Service T1–T4',
      icon: '🛎️',
      email: 'waiter.ramesh@punjabheritage.in',
      tag: 'WAITER',
      accent: 'border-amber-500/30 text-amber-400 bg-amber-500/10 hover:border-amber-500/60'
    },
    {
      id: 'cashier',
      title: 'Cashier Desk',
      desc: 'Billing & Shift POS',
      icon: '🧾',
      email: 'cashier.priya@punjabheritage.in',
      tag: 'CASHIER',
      accent: 'border-purple-500/30 text-purple-400 bg-purple-500/10 hover:border-purple-500/60'
    },
    {
      id: 'tenant_b',
      title: 'Multi-Store Chain',
      desc: 'Peshawari Grill',
      icon: '🏢',
      email: 'owner.peshawari@dinedeck.in',
      tag: 'CHAIN',
      accent: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10 hover:border-cyan-500/60'
    }
  ];

  const handleQuickPersona = async (personaEmail: string) => {
    setEmail(personaEmail);
    setPassword('Dinedeck@2026');
    setError(null);
    setSubmittingEmail(personaEmail);
    try {
      const res = await login(personaEmail, 'Dinedeck@2026');
      if (!res.success) {
        setError(res.message || 'Authentication failed. Please verify the Fastify backend is running on port 8080.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error connecting to http://localhost:8080/api/auth/login');
    } finally {
      setSubmittingEmail(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center p-4 md:p-6 overflow-hidden selection:bg-orange-500 transition-colors duration-150">
      {/* Top Right Quick Theme Switcher */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-orange-400 border border-slate-200 dark:border-slate-700 shadow-md backdrop-blur-md transition flex items-center gap-1.5 cursor-pointer active:scale-95 text-xs font-bold"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      {/* Dynamic Ambient Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

      {/* MAIN CONTAINER */}
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        {/* Left Column: Branding, Title & Optimized Value Propositions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Animated Branding Header */}
          <div
            ref={logoRef}
            style={{
              transform: logoTransform.transform,
              transition: logoTransform.transition,
              willChange: 'transform'
            }}
            className="flex items-center gap-3 origin-center select-none"
          >
            <img
              src={isDark ? "/dinedeck-logo-dark.png" : "/dinedeck-logo.png"}
              alt="DineDeck"
              className="h-8 sm:h-9 object-contain"
              draggable={false}
            />
            <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-orange-500 text-white shadow-sm">
              PARTNER
            </span>
          </div>

          {/* Value Prop & Clean Headings */}
          <div
            className={`space-y-2.5 transition-all duration-[1200ms] ease-out ${
              !showContent ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'
            }`}
          >
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
              Unified Restaurant <br />
              <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
                Operations Terminal.
              </span>
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Real-time floor dispatch, live kitchen display, and express billing in one streamlined workspace.
            </p>
          </div>

          {/* Clean Minimal Operations Highlights */}
          <div
            className={`space-y-2.5 transition-all duration-[1400ms] delay-100 ease-out ${
              !showContent ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'
            }`}
          >
            <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/80 transition">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 shrink-0">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white">Live Floor & Table Service</div>
                <div className="text-[11px] text-slate-400 truncate">QR order dispatch and instant waiter call paging</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/80 transition">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <ChefHat className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white">Kitchen Display System (KDS)</div>
                <div className="text-[11px] text-slate-400 truncate">Live preparation tickets and station routing</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/80 transition">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white">Express Billing & POS</div>
                <div className="text-[11px] text-slate-400 truncate">Instant settlements and GST thermal invoices</div>
              </div>
            </div>
          </div>

          {/* Minimal Trust Badge */}
          <div
            className={`pt-1 flex items-center space-x-4 text-[11px] text-slate-400 font-medium transition-all duration-[1600ms] delay-200 ease-out ${
              !showContent ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Role-Governed</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span className="flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Real-Time Synced</span>
            </span>
          </div>
        </div>

        {/* Right Column: Clean Login Card & Optimized 2-Column Role Grid */}
        <div
          className={`lg:col-span-7 bg-[#1E293B]/90 backdrop-blur-md rounded-3xl border border-slate-700/80 p-6 sm:p-7 shadow-2xl shadow-black/50 space-y-5 transition-all duration-[1400ms] delay-150 ease-out ${
            !showContent ? 'opacity-0 translate-y-10 scale-[0.98]' : 'opacity-100 translate-y-0 scale-100'
          }`}
        >
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">Staff / Owner Login</h3>
            <p className="text-xs text-slate-400 mt-0.5">Select a role below for instant 1-click access or enter credentials</p>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Optimized Instant 1-Click Role Login (2-Column Grid) */}
          <div className="space-y-2.5">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Zap className="w-3.5 h-3.5" />
                <span>Instant 1-Click Role Login</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">Fast-switch</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {quickRoles.map((role) => {
                const isSelected = submittingEmail === role.email;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleQuickPersona(role.email)}
                    disabled={isLoading || submittingEmail !== null}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between group disabled:opacity-50 relative overflow-hidden bg-slate-900/60 hover:bg-slate-800/90 ${role.accent}`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-base">{role.icon}</span>
                      <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded uppercase border bg-black/30 border-current opacity-80">
                        {role.tag}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-orange-400 transition flex items-center space-x-1">
                        <span className="truncate">{role.title}</span>
                        {isSelected && <Loader2 className="w-3 h-3 animate-spin text-orange-400 shrink-0" />}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {role.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex items-center justify-center my-1">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-[#1E293B] px-3 text-[10px] uppercase font-bold text-slate-500 tracking-widest shrink-0">
              Or Manual Sign In
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@restaurant.in"
                    required
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowRecoveryModal(true)}
                    className="text-[10px] font-bold text-orange-400 hover:text-orange-300 transition hover:underline"
                  >
                    Can't access your account?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || submittingEmail !== null}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 active:bg-orange-700 text-white font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {submittingEmail === email ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Operations</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Secure Public Account Access Help & Login Recovery Modal */}
      <AccountRecoveryModal
        isOpen={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
      />
    </div>
  );
};
