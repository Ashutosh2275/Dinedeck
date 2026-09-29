import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, Lock, Mail, ArrowRight, ShieldCheck, Zap, Loader2, AlertCircle, Sparkles, ChefHat, Receipt } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState<string>('owner.punjab@dinedeck.in');
  const [password, setPassword] = useState<string>('Dinedeck@2026');
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
  const [showContent, setShowContent] = useState(false);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);

  useEffect(() => {
    // 1. Calculate the exact delta from destination to screen center
    if (logoRef.current) {
      const rect = logoRef.current.getBoundingClientRect();
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const elementCenterX = rect.left + rect.width / 2;
      const elementCenterY = rect.top + rect.height / 2;

      const deltaX = centerX - elementCenterX;
      const deltaY = centerY - elementCenterY;

      // Position in center at 2.3x scale initially
      setLogoTransform({
        transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(2.2)`,
        transition: 'none',
        isCenter: true
      });

      // 2. After a graceful pause (750ms), smoothly glide to destination over 1600ms
      const glideTimer = setTimeout(() => {
        setLogoTransform({
          transform: 'translate3d(0px, 0px, 0px) scale(1)',
          transition: 'transform 1600ms cubic-bezier(0.16, 1, 0.3, 1)',
          isCenter: false
        });
      }, 750);

      // 3. Synchronized cascade: Fade in surrounding text & login card as logo arrives
      const contentTimer = setTimeout(() => {
        setShowContent(true);
      }, 1250);

      // 4. Settle into natural DOM flow
      const completeTimer = setTimeout(() => {
        setIsAnimationComplete(true);
        setLogoTransform({
          transform: 'none',
          transition: 'none',
          isCenter: false
        });
      }, 2600);

      return () => {
        clearTimeout(glideTimer);
        clearTimeout(contentTimer);
        clearTimeout(completeTimer);
      };
    } else {
      setShowContent(true);
      setIsAnimationComplete(true);
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

  const personas = [
    {
      title: '👑 Owner (Punjab Heritage)',
      email: 'owner.punjab@dinedeck.in',
      role: 'RESTAURANT_OWNER',
      color: 'border-orange-500/40 text-orange-400 bg-orange-500/10'
    },
    {
      title: '👔 General Manager (Punjab Heritage)',
      email: 'manager.sunil@punjabheritage.in',
      role: 'GENERAL_MANAGER',
      color: 'border-blue-500/40 text-blue-400 bg-blue-500/10'
    },
    {
      title: '👨‍🍳 Head Chef (Punjab Heritage)',
      email: 'chef.vikram@punjabheritage.in',
      role: 'CHEF',
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
    },
    {
      title: '🛎️ Head Waiter / Captain (Punjab - T1..T4)',
      email: 'waiter.ramesh@punjabheritage.in',
      role: 'WAITER',
      color: 'border-amber-500/40 text-amber-400 bg-amber-500/10'
    },
    {
      title: '🧾 Cashier (Punjab Heritage)',
      email: 'cashier.priya@punjabheritage.in',
      role: 'CASHIER',
      color: 'border-purple-500/40 text-purple-400 bg-purple-500/10'
    },
    {
      title: '🏢 Tenant B Owner (Peshawari Grill)',
      email: 'owner.peshawari@dinedeck.in',
      role: 'RESTAURANT_OWNER',
      color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10'
    },
    {
      title: '🛡️ Platform SuperAdmin',
      email: 'superadmin@dinedeck.in',
      role: 'DINEDECK_SUPER_ADMIN',
      color: 'border-rose-500/40 text-rose-400 bg-rose-500/10'
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
    <div className="relative min-h-screen bg-[#0F172A] flex items-center justify-center p-4 md:p-6 overflow-hidden selection:bg-orange-500">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

      {/* MAIN CONTAINER */}
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Column: Branding, Title & Value Propositions */}
        <div className="space-y-6">
          {/* Animated Branding Header: Continuous smooth FLIP transform from screen center to destination */}
          <div
            ref={logoRef}
            style={{
              transform: logoTransform.transform,
              transition: logoTransform.transition,
              willChange: 'transform'
            }}
            className="flex items-center space-x-3.5 origin-center select-none"
          >
            <div className="relative group flex-shrink-0">
              {logoTransform.isCenter && (
                <div className="absolute inset-0 bg-orange-500/40 rounded-2xl blur-xl animate-pulse" />
              )}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-xl shadow-orange-500/30 border border-orange-400/30">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                <Sparkles className="w-2.5 h-2.5" />
                OPERATING SYSTEM
              </span>
              <h1 className="text-2xl font-black text-white tracking-tight mt-0.5 whitespace-nowrap">
                DINEDECK <span className="text-orange-500">Partner</span>
              </h1>
            </div>
          </div>

          {/* Value Prop & Details (Synchronized Fade & Slide in) */}
          <div
            className={`space-y-3 transition-all duration-[1200ms] ease-out ${
              !showContent ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'
            }`}
          >
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-snug">
              Everything you need to run your restaurant.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Sign in to manage your daily tasks, kitchen orders, table service, and billing counter as per your assigned role.
            </p>
          </div>

          {/* Daily Operations Highlights */}
          <div
            className={`space-y-3 pt-1 transition-all duration-[1400ms] delay-100 ease-out ${
              !showContent ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'
            }`}
          >
            <div className="flex items-start space-x-3 text-xs text-slate-300">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-sm shrink-0 mt-0.5">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block text-xs">Live Orders & Table Service</span>
                <span className="text-slate-400 text-[11px] leading-relaxed">
                  Accept new orders, manage active dining tables, and respond to guest service calls.
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs text-slate-300">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shrink-0 mt-0.5">
                <ChefHat className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block text-xs">Kitchen Display (KDS)</span>
                <span className="text-slate-400 text-[11px] leading-relaxed">
                  Track cooking tickets, preparation times, and mark dishes ready for table pickup.
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs text-slate-300">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm shrink-0 mt-0.5">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block text-xs">Cashier & Quick Billing</span>
                <span className="text-slate-400 text-[11px] leading-relaxed">
                  Fast bill generation, payment settlements, and daily shift cash tracking.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Login Card & Quick Personas (Synchronized Fade & Glide in) */}
        <div
          className={`bg-[#1E293B]/90 backdrop-blur-md rounded-2xl border border-slate-700/80 p-6 md:p-7 shadow-2xl shadow-black/50 space-y-6 transition-all duration-[1400ms] delay-150 ease-out ${
            !showContent ? 'opacity-0 translate-y-10 scale-[0.97]' : 'opacity-100 translate-y-0 scale-100'
          }`}
        >
          <div>
            <h3 className="text-lg font-bold text-white">Staff / Owner Login</h3>
            <p className="text-xs text-slate-400 mt-1">Authenticate to load your role context and assigned branch</p>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@restaurant.in"
                  required
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || submittingEmail !== null}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 active:bg-orange-700 text-white font-black py-3 px-4 rounded-xl text-sm transition shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
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

          {/* Quick Persona Switcher */}
          <div className="pt-4 border-t border-slate-700/80">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Instant 1-Click Role Login</span>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
              {personas.map((p) => (
                <button
                  key={p.email}
                  type="button"
                  onClick={() => handleQuickPersona(p.email)}
                  disabled={isLoading || submittingEmail !== null}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-700/60 hover:border-orange-500/40 text-left transition group disabled:opacity-50"
                >
                  <div className="flex-1 pr-2">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-orange-400 transition flex items-center space-x-1.5">
                      <span>{p.title}</span>
                      {submittingEmail === p.email && <Loader2 className="w-3 h-3 animate-spin text-orange-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{p.email}</div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border shrink-0 ${p.color}`}>
                    {p.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
