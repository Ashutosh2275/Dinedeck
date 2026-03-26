import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import ScrollReveal from './ui/ScrollReveal';
import GradientBadge from './ui/GradientBadge';
import DashboardMockup from './ui/DashboardMockup';
import TextReveal from './ui/TextReveal';
import MagneticButton from './ui/MagneticButton';
import { ArrowRight, Play } from 'lucide-react';

export default function Hero() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

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
    <section className="min-h-screen pt-[160px] pb-20 px-6 relative overflow-hidden bg-white">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Mesh Gradient Blobs */}
        <motion.div 
          style={{ y: y1 }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-100/40 blur-[120px] rounded-full"
          animate={{
            x: [0, 30, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          style={{ y: y2 }}
          className="absolute top-[20%] right-[-5%] w-[45%] h-[45%] bg-violet-100/30 blur-[100px] rounded-full"
          animate={{
            x: [0, -40, 0],
            y: [0, 60, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 2 }}
        />
        <motion.div 
          className="absolute bottom-[-10%] left-[10%] w-[40%] h-[40%] bg-orange-50/20 blur-[100px] rounded-full"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear", delay: 4 }}
        />
        
        {/* Dot Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.2] bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[55%_45%] gap-16 items-center relative z-10">
        {/* Left column */}
        <div className="relative order-1 lg:order-1">
          <ScrollReveal variant="fadeRight">
            <GradientBadge className="mb-8">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-900 font-semibold text-xs tracking-wider uppercase">Now live in Bhubaneswar &amp; Cuttack</span>
            </GradientBadge>
          </ScrollReveal>

          <TextReveal 
            text="Run Your Entire Restaurant From One Smart Screen" 
            className="text-[clamp(32px,8vw,72px)] font-extrabold leading-[1.02] tracking-[-3px] text-slate-900 mb-8 font-display"
          />

          <ScrollReveal variant="blur" delay={0.6}>
            <p className="text-[clamp(16px,2vw,22px)] text-slate-600 leading-relaxed mb-10 max-w-[580px] font-medium">
              POS billing · QR ordering · Kitchen tickets · Analytics — DineDeck replaces 5 tools with one beautiful dashboard built for Indian restaurants.
            </p>
          </ScrollReveal>

          <ScrollReveal variant="fadeUp" delay={0.8}>
            <div className="flex flex-col sm:flex-row gap-5 mb-10">
              <MagneticButton intensity={0.3} className="w-full sm:w-auto">
                <button 
                   onClick={() => scrollTo('#pricing')} 
                   className="group relative overflow-hidden inline-flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-5 bg-brand-orange text-white rounded-2xl font-black text-lg font-display border-none cursor-pointer shadow-2xl shadow-orange-200/50 transition-transform active:scale-95"
                >
                  <span className="relative z-10">Start Free Trial</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                    animate={{ translateX: ['200%', '-100%'] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 1 }}
                  />
                </button>
              </MagneticButton>
              
              <MagneticButton intensity={0.2} className="w-full sm:w-auto">
                <button 
                  onClick={() => scrollTo('#demo')} 
                  className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-5 border-2 border-slate-200 text-slate-800 rounded-2xl font-bold text-lg font-display hover:border-indigo-600 hover:text-indigo-600 transition-all bg-white/50 backdrop-blur-sm cursor-pointer group active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Watch Demo</span>
                </button>
              </MagneticButton>
            </div>
          </ScrollReveal>

          <div className="flex flex-wrap gap-x-8 gap-y-3 text-slate-500 font-medium">
            {['14-day free trial', 'No credit card', 'Setup in 60 mins'].map((item, i) => (
              <ScrollReveal key={i} variant="fadeUp" delay={1.2 + i * 0.1} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.5 + i * 0.1, type: "spring" }}
                    className="text-indigo-600 text-xs"
                  >
                    ✓
                  </motion.span>
                </span>
                <span className="text-sm">{item}</span>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* Right column — Dashboard (Shown below text on mobile) */}
        <ScrollReveal variant="scaleUp" delay={1} className="relative order-2 lg:order-2">
          {/* Decorative Glow */}
          <motion.div 
            className="absolute -inset-4 bg-indigo-500/10 blur-[40px] rounded-[30px] z-0"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          
          <motion.div
            className="relative z-10 origin-top lg:origin-center scale-[0.8] md:scale-90 lg:scale-100 max-h-[350px] md:max-h-none overflow-hidden lg:overflow-visible"
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            whileHover={{ scale: 1.02, rotateY: 5, rotateX: -2 }}
            style={{ perspective: 1000 }}
          >
            <DashboardMockup />
          </motion.div>

          {/* Floating Element 1 */}
          <motion.div
            className="absolute -top-6 -right-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100 z-20 hidden xl:block"
            animate={{ y: [0, 10, 0], x: [0, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                ₹
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">New Sale</p>
                <p className="font-bold text-slate-800 tracking-tight">+₹1,250</p>
              </div>
            </div>
          </motion.div>
        </ScrollReveal>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-400 pointer-events-none"
        style={{ opacity }}
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Scroll to explore</span>
        <motion.div 
          className="w-5 h-8 border-2 border-slate-300 rounded-full flex justify-center p-1"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div 
            className="w-1 h-1.5 bg-indigo-600 rounded-full"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
