import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Zap, Sparkles, Check } from 'lucide-react';
import ScrollReveal from './ui/ScrollReveal';
import TextReveal from './ui/TextReveal';
import AnimatedCounter from './ui/AnimatedCounter';
import { HOW_IT_WORKS_STEPS } from '../constants';

export default function HowItWorks() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end center"]
  });

  const pathLength = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <section id="how-it-works" className="py-32 px-6 bg-white relative overflow-hidden">
      <div className="max-w-[1000px] mx-auto text-center relative z-10" ref={containerRef}>
        <ScrollReveal variant="blur">
          <div className="flex justify-center mb-6">
            <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100">
              The Process
            </span>
          </div>
          <h2 className="text-[clamp(36px,5vw,52px)] font-black tracking-[-2px] text-slate-900 mb-6 font-display leading-tight">
            Up and Running in 3 Steps
          </h2>
          <p className="text-slate-500 text-xl mb-24 max-w-[600px] mx-auto font-medium">
            We've simplified the transition. Most Indian restaurants go live in under 60 minutes with our white-glove setup.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Animated Connecting Line */}
          <div className="hidden md:block absolute top-[48px] left-[15%] right-[15%] h-[2px] z-0">
            <svg width="100%" height="2" className="overflow-visible">
              <motion.line
                x1="0"
                y1="1"
                x2="100%"
                y2="1"
                stroke="#e2e8f0"
                strokeWidth="2"
                strokeDasharray="8 12"
              />
              <motion.line
                x1="0"
                y1="1"
                x2="100%"
                y2="1"
                stroke="#4f46e5"
                strokeWidth="3"
                strokeDasharray="8 12"
                style={{ pathLength }}
              />
            </svg>
          </div>

          {HOW_IT_WORKS_STEPS.map((step, i) => (
            <ScrollReveal 
              key={step.number} 
              variant="fadeUp" 
              delay={i * 0.2}
              className="relative z-10 group"
            >
              <motion.div 
                className="w-24 h-24 bg-white rounded-3xl shadow-xl border border-slate-100 flex items-center justify-center mx-auto mb-8 relative group-hover:border-indigo-500 transition-colors duration-500"
                whileHover={{ y: -10, rotate: i % 2 === 0 ? 5 : -5 }}
              >
                <div className="absolute inset-0 bg-indigo-600 rounded-3xl opacity-0 group-hover:opacity-10 scale-90 group-hover:scale-110 transition-all duration-500" />
                <span className="text-4xl font-black text-slate-900 font-display group-hover:text-indigo-600 transition-colors">
                  {step.number}
                </span>
                
                {/* Floating particles for the number */}
                <motion.div 
                  className="absolute -top-2 -right-2"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-5 h-5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              </motion.div>
              
              <h3 className="font-black text-2xl text-slate-900 mb-4 font-display tracking-tight group-hover:text-indigo-600 transition-colors">
                {step.title}
              </h3>
              <p className="text-slate-500 text-base leading-relaxed font-medium px-4">
                {step.description}
              </p>
              
              {/* Completed Checkmark Indicator */}
              <motion.div 
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ delay: i * 0.3 + 0.8, type: "spring" }}
                className="mt-6 inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Check className="w-3 h-3" /> Step Verified
              </motion.div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal variant="blur" delay={0.6}>
          <div className="mt-20 relative inline-block group">
            <motion.div 
              className="absolute -inset-4 bg-indigo-600/5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="bg-white rounded-2xl py-6 px-10 flex gap-5 items-center border border-slate-100 shadow-xl relative z-10 group-hover:border-indigo-200 transition-all duration-500">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <Zap className="w-6 h-6 fill-current" />
              </div>
              <div className="text-left">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Onboarding Speed</p>
                <span className="text-slate-900 font-black text-xl font-display">
                  Average setup time: <span className="text-indigo-600 inline-flex items-center gap-1 group-hover:scale-110 transition-transform origin-left">
                    <AnimatedCounter target={47} /> minutes <Sparkles className="w-5 h-5" />
                  </span>
                </span>
              </div>
            </div>
            
            {/* Tiny stars surrounding the stat */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-indigo-400 pointer-events-none opacity-0 group-hover:opacity-100"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [-10, -30],
                  x: [0, (Math.random() - 0.5) * 50],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.4,
                }}
              >
                <Sparkles className="w-3 h-3" />
              </motion.div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
