import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, LayoutGroup } from 'framer-motion';
import ScrollReveal from './ui/ScrollReveal';
import GlowCard from './ui/GlowCard';
import AnimatedCounter from './ui/AnimatedCounter';
import { DEMO_STEPS } from '../constants';
import { Check, Sparkles } from 'lucide-react';

/* ─── Phone Mockup Shell ─── */
function PhoneMockup({ children, className = "" }) {
  return (
    <motion.div 
      initial={{ y: -40, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className={`w-[280px] h-[520px] rounded-[40px] border-[6px] border-slate-900 bg-slate-950 relative overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] mx-auto ${className}`}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[110px] h-7 bg-slate-900 rounded-b-3xl z-40" />
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-800 rounded-full z-50" />
      {children}
      {/* Floating Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-indigo-400 rounded-full pointer-events-none z-0"
          animate={{
            x: [Math.random() * 280, Math.random() * 280],
            y: [Math.random() * 520, Math.random() * 520],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </motion.div>
  );
}

/* ─── Step 0: QR Scan ─── */
function ScanQR() {
  const qrCells = [
    1,0,1,0,1,1,1, 
    1,1,0,1,0,1,0, 
    0,1,1,0,1,0,1,
    1,0,1,1,0,1,1, 
    1,1,0,1,1,0,0, 
    0,1,1,0,1,1,1,
    1,0,1,1,0,1,0,
  ];

  return (
    <PhoneMockup>
      <div className="pt-16 px-6 flex flex-col items-center justify-center h-full bg-[#0F172A] relative z-10">
        <motion.div 
          className="w-44 h-44 bg-white rounded-2xl p-4 relative overflow-hidden shadow-2xl"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="grid grid-cols-7 gap-1.5 relative z-10">
            {qrCells.map((cell, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.015 }}
                className={`aspect-square rounded-[1px] ${cell ? 'bg-slate-900' : 'bg-transparent'}`} 
              />
            ))}
          </div>
          {/* Laser Sweep */}
          <motion.div 
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent z-20 shadow-[0_0_15px_rgba(52,211,153,0.8)]" 
            animate={{ top: ['10%', '90%', '10%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Success Flash */}
          <motion.div
            className="absolute inset-0 bg-emerald-400 z-30 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ delay: 1.5, duration: 0.6 }}
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="text-center mt-8"
        >
          <p className="text-white font-bold font-display text-lg tracking-tight">Scan to Order</p>
          <p className="text-slate-400 text-sm mt-1">Table 4 · DineDeck</p>
          
          <motion.div 
            className="mt-6 flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            Active Table Session
          </motion.div>
        </motion.div>
      </div>
    </PhoneMockup>
  );
}

/* ─── Step 1: Menu ─── */
function ViewMenu() {
  const items = [
    { name: 'Paneer Butter Masala', desc: 'Rich, creamy curry', price: 280, gradient: 'from-amber-400 to-amber-500' },
    { name: 'Garlic Naan', desc: 'Fresh from tandoor', price: 60, gradient: 'from-orange-500 to-orange-600' },
    { name: 'Mango Lassi', desc: 'Chilled & creamy', price: 120, gradient: 'from-violet-400 to-violet-600' },
    { name: 'Veg Biryani', desc: 'Aromatic basmati rice', price: 220, gradient: 'from-emerald-400 to-emerald-600' },
  ];

  return (
    <PhoneMockup>
      <motion.div 
        initial={{ x: 300 }}
        animate={{ x: 0 }}
        className="pt-12 px-4 bg-white h-full overflow-hidden rounded-[36px] relative z-10"
      >
        <div className="flex gap-2 mb-6 overflow-hidden relative">
          {['All', 'Starters', 'Main'].map((cat, i) => (
            <motion.span 
              key={cat} 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap relative z-10 ${i === 0 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-500'}`}
            >
              {cat}
            </motion.span>
          ))}
          {/* Active Tab Indicator */}
          <motion.div 
            layoutId="active-cat"
            className="absolute left-0 top-0 bottom-0 w-[42px] bg-indigo-600 rounded-xl z-0"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        </div>

        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1, type: 'spring', damping: 20 }}
              whileHover={{ scale: 1.02, x: 5 }}
              className={`rounded-2xl p-3 flex gap-3 items-center transition-colors border ${i === 2 ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-100 bg-slate-50'}`}
            >
              <motion.div 
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.gradient} flex-shrink-0 relative overflow-hidden`}
                whileHover={{ rotate: 5, scale: 1.1 }}
              >
                <div className="absolute inset-0 bg-white/20" />
              </motion.div>
              <div className="flex-1">
                <p className="font-bold text-[13px] text-slate-800">{item.name}</p>
                <p className="text-[11px] text-slate-500 font-medium">{item.desc}</p>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-indigo-600 text-sm">₹<AnimatedCounter target={item.price} /></p>
                {i === 2 && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mt-1 bg-indigo-600 text-white rounded-full p-0.5"
                  >
                    <Check className="w-2.5 h-2.5" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </PhoneMockup>
  );
}

/* ─── Step 2: Order Cart ─── */
function PlaceOrder() {
  const cartItems = [
    { name: 'Paneer Butter Masala', qty: 2, price: 560 },
    { name: 'Garlic Naan', qty: 1, price: 60 },
    { name: 'Mango Lassi', qty: 1, price: 120 },
  ];

  return (
    <PhoneMockup>
      <div className="pt-12 px-5 bg-white h-full rounded-[36px] relative z-10 flex flex-col">
        <motion.p 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-extrabold text-2xl text-slate-900 mb-6 font-display"
        >
          Your Cart
        </motion.p>
        
        <div className="space-y-3 flex-1 overflow-visible">
          {cartItems.map((item, i) => (
            <motion.div 
              key={item.name} 
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.1, type: 'spring' }}
              className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center border border-slate-100 shadow-sm"
            >
              <div>
                <p className="font-bold text-sm text-slate-800">{item.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Qty:</span>
                  <span className="text-sm font-extrabold text-indigo-600">{item.qty}</span>
                </div>
              </div>
              <p className="font-extrabold text-slate-900 text-base">₹<AnimatedCounter target={item.price} /></p>
            </motion.div>
          ))}
        </div>

        <div className="border-t-2 border-dashed border-slate-200 py-6 mt-4">
          <div className="flex justify-between items-center mb-6">
            <span className="font-bold text-lg text-slate-800">Total</span>
            <span className="font-black text-2xl text-indigo-600 font-display">₹<AnimatedCounter target={777} /></span>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            className="w-full py-4 bg-brand-orange text-white rounded-2xl font-bold text-lg font-display border-none cursor-pointer shadow-xl shadow-orange-200/50 flex items-center justify-center gap-2 overflow-hidden group relative"
          >
            <span className="relative z-10">Place Order</span>
            <motion.div 
              className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin hidden group-active:block"
            />
            <motion.div 
              className="absolute inset-0 bg-white/20"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            />
          </motion.button>
        </div>
      </div>
    </PhoneMockup>
  );
}

/* ─── Step 3: Kitchen KOT ─── */
function KitchenKOT() {
  const [status, setStatus] = useState('NEW');

  useEffect(() => {
    const timer = setTimeout(() => setStatus('PREPARING'), 1500);
    const timer2 = setTimeout(() => setStatus('READY'), 3000);
    return () => { clearTimeout(timer); clearTimeout(timer2); };
  }, []);

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="w-[340px] min-h-[460px] bg-slate-900 rounded-2xl p-6 font-mono text-slate-300 border border-slate-700 shadow-2xl relative overflow-hidden"
    >
      <motion.div 
        className="absolute inset-0 bg-white/5 pointer-events-none"
        animate={{ opacity: [0, 0.1, 0] }}
        transition={{ repeat: Infinity, duration: 4 }}
      />
      
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-2">
          <motion.div 
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
          />
          <span className="text-white font-bold text-xs tracking-widest">KITCHEN DISPLAY</span>
        </div>
        <span className="text-slate-500 text-xs font-bold tracking-tighter">14:23:05</span>
      </div>

      <motion.div 
        layout
        className={`bg-slate-800/80 backdrop-blur-sm rounded-xl p-5 mb-4 border-l-4 shadow-xl relative overflow-hidden ${
          status === 'NEW' ? 'border-rose-500' : status === 'PREPARING' ? 'border-orange-500' : 'border-emerald-500'
        }`}
      >
        <div className="flex justify-between items-center mb-5 relative z-10">
          <span className="text-white font-black text-xl tracking-tight">TABLE 4</span>
          <AnimatePresence mode="wait">
            <motion.span 
              key={status}
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: -10 }}
              className={`px-3 py-1 rounded-lg text-white text-[10px] font-black tracking-widest shadow-lg ${
                status === 'NEW' ? 'bg-rose-500 animate-pulse' : status === 'PREPARING' ? 'bg-orange-500' : 'bg-emerald-500'
              }`}
            >
              {status}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="space-y-4 relative z-10 text-[13px] font-bold">
          {[
            { name: "Paneer Butter Masala", q: 2 },
            { name: "Garlic Naan", q: 1 },
            { name: "Mango Lassi", q: 1 }
          ].map((item, i) => (
            <motion.div 
              key={item.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i + 0.5 }}
              className="flex justify-between border-b border-slate-700/50 pb-2"
            >
              <span className="text-slate-100">{item.q}× {item.name}</span>
              <motion.div 
                animate={status === 'READY' ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                className="text-emerald-400"
              >
                <Check className="w-4 h-4" />
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Wave Animation on Status Change */}
        <motion.div 
          key={`wave-${status}`}
          className="absolute inset-0 bg-white/10"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 4, opacity: [0, 1, 0] }}
          transition={{ duration: 1 }}
        />
      </motion.div>

      <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold relative z-10">
        <span>#1045 • 2:23 PM</span>
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`w-1 h-1 rounded-full ${i < 3 ? 'bg-slate-700' : 'bg-slate-800'}`} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

const stepVisuals = [ScanQR, ViewMenu, PlaceOrder, KitchenKOT];

export default function LiveDemo() {
  const [activeStep, setActiveStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const [progress, setProgress] = useState(0);

  const resetTimer = () => {
    clearInterval(timerRef.current);
    setProgress(0);
    if (!paused) {
      const stepDuration = 4000;
      const interval = 40;
      const increment = (interval / stepDuration) * 100;
      
      timerRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setActiveStep(current => (current + 1) % 4);
            return 0;
          }
          return prev + increment;
        });
      }, interval);
    }
  };

  useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, [paused, activeStep]);

  const goToStep = (n) => {
    setActiveStep(n);
  };

  const Visual = stepVisuals[activeStep];
  const step = DEMO_STEPS[activeStep];

  const scrollTo = (href) => {
    const el = document.querySelector(href);
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="demo" className="py-24 px-6 bg-slate-50/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-100/30 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="max-w-[1100px] mx-auto text-center relative z-10">
        <ScrollReveal>
          <div className="flex justify-center mb-6">
            <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-200">
              The Experience
            </span>
          </div>
          <h2 className="text-[clamp(36px,5vw,56px)] font-black tracking-[-2px] text-slate-900 mb-6 font-display">
            See DineDeck In Action
          </h2>
          <p className="text-slate-500 text-xl mb-16 max-w-[600px] mx-auto font-medium">
            From scan to serve — watch the complete order flow that keeps your tables turning
          </p>
        </ScrollReveal>

        {/* Improved Step tabs */}
        <div className="flex justify-center items-center gap-3 mb-16 flex-wrap">
          <LayoutGroup>
            {DEMO_STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3">
                <button
                  onClick={() => goToStep(i)}
                  className={`relative px-8 py-3.5 rounded-2xl font-bold text-sm cursor-pointer font-display transition-all overflow-hidden ${
                    activeStep === i
                      ? 'text-white'
                      : 'bg-white border-2 border-slate-100 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 shadow-sm'
                  }`}
                >
                  {activeStep === i && (
                    <motion.div
                      layoutId="active-step-tab"
                      className="absolute inset-0 bg-indigo-600"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 hidden sm:inline">{s.tab}</span>
                  <span className="relative z-10 sm:hidden">{i + 1}</span>
                </button>
                {i < 3 && (
                  <div className="w-8 h-[2px] bg-slate-200 rounded hidden md:block" />
                )}
              </div>
            ))}
          </LayoutGroup>
        </div>

        {/* Demo content container with GlowCard */}
        <GlowCard 
          className="bg-white/80 backdrop-blur-md border-slate-200/60 shadow-2xl overflow-hidden p-0"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Liquid Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-50">
            <motion.div 
              className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400"
              style={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-12 md:p-20 flex items-center justify-center bg-slate-900/5 border-r border-slate-100">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`visual-${activeStep}`}
                  initial={{ opacity: 0, scale: 0.9, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -20 }}
                  transition={{ type: "spring", damping: 20, stiffness: 100 }}
                  className="w-full flex justify-center"
                >
                  <Visual />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="p-10 md:p-16 flex flex-col justify-center text-left bg-white relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`text-${activeStep}`}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ type: "spring", damping: 25, stiffness: 150 }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-200">
                      {activeStep + 1}
                    </span>
                    <span className="bg-indigo-50 text-indigo-600 px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-widest">{step.badge}</span>
                  </div>
                  <h3 className="text-[clamp(28px,4vw,40px)] font-black text-slate-900 mb-6 tracking-tight leading-tight font-display">
                    {step.title}
                  </h3>
                  <p className="text-slate-500 text-lg leading-relaxed mb-8 font-medium">
                    {step.subtitle}
                  </p>
                  
                  <ul className="space-y-4 mb-10">
                    {['Automated setup', 'Real-time updates', 'Cloud synced'].map((feat, i) => (
                      <motion.li 
                        key={feat}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="flex items-center gap-3 text-slate-700 font-bold text-sm"
                      >
                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <Check className="w-3 h-3" />
                        </div>
                        {feat}
                      </motion.li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => scrollTo('#pricing')}
                    className="inline-flex items-center gap-3 text-indigo-600 font-black text-sm uppercase tracking-widest hover:gap-5 transition-all group"
                  >
                    Explore all features <span className="text-xl">→</span>
                  </button>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </GlowCard>

        {/* Interactive Stats Toggle */}
        <ScrollReveal delay={0.4} className="mt-16 bg-white p-8 rounded-3xl border border-slate-100 shadow-xl inline-block">
          <div className="flex items-center gap-12">
            <div>
              <p className="text-[32px] font-black text-slate-900 tracking-tighter mb-1 font-display">
                <AnimatedCounter target={64} suffix="%" />
              </p>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Faster Turnaround</p>
            </div>
            <div className="w-px h-12 bg-slate-100" />
            <div>
              <p className="text-[32px] font-black text-indigo-600 tracking-tighter mb-1 font-display flex items-center gap-1">
                <AnimatedCounter target={0} /><Sparkles className="w-6 h-6" />
              </p>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Commission Fees</p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
