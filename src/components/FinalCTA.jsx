import React from 'react';
import { motion } from 'framer-motion';
import ScrollReveal from './ui/ScrollReveal';
import TextReveal from './ui/TextReveal';
import MagneticButton from './ui/MagneticButton';
import { ArrowRight, Sparkles, Check } from 'lucide-react';

export default function FinalCTA() {
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
    <section className="py-32 px-6 bg-[#0F172A] relative overflow-hidden">
      {/* Animated Gradient Background */}
      <motion.div 
        animate={{
          background: [
            'radial-gradient(circle at 20% 20%, #4f46e5 0%, transparent 50%)',
            'radial-gradient(circle at 80% 80%, #4338ca 0%, transparent 50%)',
            'radial-gradient(circle at 20% 20%, #4f46e5 0%, transparent 50%)',
          ]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 opacity-30"
      />

      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full pointer-events-none"
          initial={{ 
            x: Math.random() * 2000, 
            y: Math.random() * 1000,
            opacity: Math.random() 
          }}
          animate={{
            y: [null, -1000],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 10
          }}
        />
      ))}

      {/* Decorative Geometric Shapes */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-20 -left-20 w-80 h-80 border border-white/5 rounded-full z-0"
      >
        <div className="absolute top-0 left-1/2 w-4 h-4 bg-indigo-500/20 rounded-full" />
      </motion.div>
      <motion.div 
        animate={{ rotate: -360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        className="absolute -top-20 -right-20 w-96 h-96 border border-white/5 rounded-[40%] z-0"
      />

      <div className="max-w-[1000px] mx-auto text-center relative z-10">
        <div className="flex justify-center mb-8">
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/20"
          >
            <Sparkles className="w-8 h-8 text-indigo-600" />
          </motion.div>
        </div>

        <TextReveal 
          text="Ready to Transform Your Restaurant?" 
          className="text-[clamp(40px,6vw,72px)] font-black tracking-[-3px] text-white mb-8 font-display leading-[1.05]"
        />
        
        <ScrollReveal variant="blur" delay={0.4}>
          <p className="text-white/70 text-xl md:text-2xl mb-16 max-w-[700px] mx-auto font-medium">
            Join the restaurants in Bhubaneswar and Cuttack already running smarter, faster, and more profitably with DineDeck.
          </p>
        </ScrollReveal>

        <ScrollReveal variant="fadeUp" delay={0.6}>
          <div className="flex gap-6 justify-center flex-wrap mb-12">
            <MagneticButton intensity={0.3}>
              <motion.button 
                onClick={() => scrollTo('#pricing')} 
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="group relative overflow-hidden px-12 py-5 bg-brand-orange text-white rounded-2xl font-black text-lg font-display border-none cursor-pointer shadow-2xl shadow-orange-500/20 transition-all active:scale-95"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Get Started Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                </span>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                  animate={{ translateX: ['200%', '-100%'] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 1 }}
                />
              </motion.button>
            </MagneticButton>
            
            <MagneticButton intensity={0.2}>
              <button 
                onClick={() => scrollTo('#contact')} 
                className="px-12 py-5 border-2 border-white/20 text-white rounded-2xl font-black text-lg font-display bg-white/5 backdrop-blur-sm cursor-pointer hover:bg-white/10 hover:border-white transition-all active:scale-95"
              >
                Book a Live Demo
              </button>
            </MagneticButton>
          </div>
        </ScrollReveal>

        <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-white/50 font-black text-xs uppercase tracking-[0.2em]">
          {['60 minute setup', 'Personal onboarding', 'No hidden fees'].map((item, i) => (
            <ScrollReveal key={item} delay={0.8 + i * 0.1}>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-indigo-400 stroke-[3px]" />
                {item}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
