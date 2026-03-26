import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Check } from 'lucide-react';
import { FEATURES } from '../constants';
import ScrollReveal from './ui/ScrollReveal';
import GlowCard from './ui/GlowCard';

export default function FeaturesGrid() {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

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
    <section id="features" className="py-24 px-4 bg-white relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto">
        <ScrollReveal variant="blur">
          <div className="text-center mb-16">
            <h2 className="text-[clamp(36px,5vw,52px)] font-black tracking-[-2px] text-slate-900 mb-6 font-display">
              Built for Scale. Optimized for Profit.
            </h2>
            <p className="text-slate-500 text-xl max-w-[700px] mx-auto font-medium">
              Everything you need to run a high-performance restaurant, in one unified platform.
            </p>
          </div>
        </ScrollReveal>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature, idx) => (
            <motion.div 
              key={feature.id}
              layout
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="contents" // Use contents to handle grid placement if expanding in-place is tricky
            >
              <ScrollReveal delay={idx * 0.1} variant="fadeUp">
                <GlowCard 
                  className={`h-full cursor-pointer transition-all duration-500 ${expandedId === feature.id ? 'ring-2 ring-indigo-600 shadow-2xl shadow-indigo-100' : ''}`}
                  onClick={() => toggleExpand(feature.id)}
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-6 shadow-lg`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3 font-display">{feature.title}</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  
                  <div className="mt-auto flex items-center justify-between">
                    <button 
                      className="text-[11px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-1 group/btn"
                    >
                      Learn more 
                      <motion.span
                        animate={{ rotate: expandedId === feature.id ? 90 : 0 }}
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </motion.span>
                    </button>
                  </div>
                </GlowCard>
              </ScrollReveal>

              {/* Expansion Panel (CHANGE 3) - Logic to show below the row */}
              {/* On mobile: show immediately after card. On desktop: might need a better logic if we want it "below the row" */}
              {/* For simplicity and best mobile exp, we'll show it immediately after the card on mobile, 
                  but we'll use a full-width container on desktop that takes the full row. */}
              
              <AnimatePresence>
                {expandedId === feature.id && (
                  <motion.div
                    layout
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="col-span-1 md:col-span-2 lg:col-span-4 overflow-hidden"
                  >
                    <div className="py-6">
                      <div className="bg-slate-50 rounded-[32px] p-8 md:p-12 border-l-8 border-indigo-600 shadow-xl relative overflow-hidden group/panel">
                        <button 
                          onClick={() => setExpandedId(null)}
                          className="absolute top-6 right-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-50 hover:text-rose-500 transition-colors z-20 border-none cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
                          <div>
                            <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest mb-6 inline-block">
                              Detailed Deep Dive
                            </span>
                            <h4 className="text-[clamp(24px,4vw,36px)] font-black text-slate-900 mb-6 leading-tight font-display">
                              {feature.expansion.headline}
                            </h4>
                            <div className="space-y-6 mb-8">
                              <div>
                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                   <X className="w-3 h-3" /> The Problem
                                </p>
                                <p className="text-slate-600 font-medium leading-relaxed">
                                  {feature.expansion.problem}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                  <Check className="w-3 h-3" /> The Solution
                                </p>
                                <p className="text-slate-600 font-medium leading-relaxed">
                                  {feature.expansion.solution}
                                </p>
                              </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-10">
                              <p className="text-[32px] font-black text-indigo-600 tracking-tighter mb-1 font-display">
                                {feature.expansion.stats.match(/\d+/g)?.[0] || '10'}
                                <span className="text-xl font-black text-slate-400 font-sans">{feature.expansion.stats.includes('%') ? '%' : ''}</span>
                              </p>
                              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                {feature.expansion.stats}
                              </p>
                            </div>

                            <button 
                              onClick={() => {
                                setExpandedId(null);
                                scrollTo(feature.expansion.target);
                              }}
                              className="h-[52px] px-8 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all border-none cursor-pointer"
                            >
                              {feature.expansion.cta} →
                            </button>
                          </div>

                          <div className="relative hidden md:block">
                             {/* Small UI Mockup Placeholder based on feature id */}
                             <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 aspect-[4/3] relative overflow-hidden">
                                <div className="flex items-center gap-2 mb-4">
                                   <div className="w-3 h-3 rounded-full bg-rose-400" />
                                   <div className="w-3 h-3 rounded-full bg-amber-400" />
                                   <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                </div>
                                <div className="space-y-4">
                                   <div className="h-4 bg-slate-100 rounded-full w-3/4" />
                                   <div className="h-20 bg-slate-50 rounded-xl" />
                                   <div className="grid grid-cols-2 gap-4">
                                      <div className="h-12 bg-indigo-50 rounded-lg" />
                                      <div className="h-12 bg-slate-50 rounded-lg" />
                                   </div>
                                </div>
                                {/* Feature Icon Ghost */}
                                <feature.icon className="absolute -bottom-10 -right-10 w-40 h-40 text-slate-50" />
                             </div>
                             {/* Floating badge */}
                             <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} text-white flex items-center justify-center`}>
                                   <Check className="w-5 h-5" />
                                </div>
                                <div>
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Certified</p>
                                   <p className="text-sm font-black text-slate-900">Enterprise Ready</p>
                                </div>
                             </div>
                          </div>
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
