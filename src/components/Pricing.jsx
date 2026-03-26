import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { PRICING_PLANS } from '../constants';
import ScrollReveal from './ui/ScrollReveal';
import MagneticButton from './ui/MagneticButton';

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  // Annual calculation: Monthly * 12 * 0.8 (20% off)
  const calculatePrice = (monthlyPrice) => {
    return isAnnual ? Math.round(monthlyPrice * 0.8) : monthlyPrice;
  };

  const calculateSavings = (monthlyPrice) => {
    const totalMonthly = monthlyPrice * 12;
    const totalAnnual = Math.round(monthlyPrice * 0.8) * 12;
    return totalMonthly - totalAnnual;
  };

  return (
    <section id="pricing" className="py-24 px-4 bg-white relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto relative z-10">
        <ScrollReveal variant="blur">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <span className="bg-indigo-600/10 text-indigo-600 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] border border-indigo-600/10">
                Simple Pricing
              </span>
            </div>
            <h2 className="text-[clamp(36px,5vw,52px)] font-black tracking-[-2px] text-slate-900 mb-6 font-display leading-[1.1]">
              Invest in Your Restaurant's Future
            </h2>
            <p className="text-slate-500 text-xl max-w-[600px] mx-auto font-medium">
              Start for free, upgrade when you're ready. No hidden fees.
            </p>
          </div>
        </ScrollReveal>

        {/* Toggle (CHANGE 1) */}
        <div className="flex flex-col items-center mb-16">
          <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center relative h-14 w-full max-w-[320px]">
            <button 
              onClick={() => setIsAnnual(false)}
              className={`flex-1 relative z-10 font-bold text-sm transition-colors duration-300 ${!isAnnual ? 'text-white' : 'text-slate-500'}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setIsAnnual(true)}
              className={`flex-1 relative z-10 font-bold text-sm transition-colors duration-300 ${isAnnual ? 'text-white' : 'text-slate-500'}`}
            >
              Annual <span className="ml-1 text-[10px] bg-emerald-500/20 text-emerald-600 px-1.5 py-0.5 rounded-md">-20%</span>
            </button>
            <motion.div 
              className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200"
              animate={{ x: isAnnual ? '100%' : '0%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>
        </div>

        {/* Pricing Cards Grid (MOBILE CRITICAL: Vertical stack + Growth first) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          {/* Growth Plan - Rendered First on Mobile via order prop if needed, or just reorder in array */}
          {PRICING_PLANS.slice().reverse().map((plan) => {
            const isGrowth = plan.id === 'growth';
            const price = calculatePrice(plan.price);
            const savings = calculateSavings(plan.price);

            return (
              <ScrollReveal 
                key={plan.id} 
                variant={isGrowth ? "fadeUp" : "fadeUp"}
                delay={isGrowth ? 0.1 : 0.2}
                className={`flex flex-col ${isGrowth ? 'order-1 lg:order-2' : 'order-2 lg:order-1'}`}
              >
                <div className={`h-full rounded-[32px] p-8 md:p-10 border-2 transition-all duration-500 group relative flex flex-col ${
                  isGrowth 
                    ? 'bg-white border-indigo-600 shadow-2xl shadow-indigo-500/10' 
                    : 'bg-white border-slate-100 hover:border-slate-200 shadow-xl shadow-slate-200/50'
                }`}>
                  {isGrowth && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-brand-orange text-white px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-widest shadow-xl shadow-orange-200 flex items-center gap-2 z-20">
                      <Sparkles className="w-3.5 h-3.5" />
                      Most Popular 🔥
                    </div>
                  )}

                  <div className="mb-10">
                    <p className={`text-[11px] font-black uppercase tracking-[0.2em] mb-4 ${isGrowth ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {plan.name}
                    </p>
                    <div className="flex items-baseline gap-1 mb-2">
                       <span className="text-2xl font-black text-slate-900 self-start mt-2">₹</span>
                       <motion.span 
                         key={price}
                         initial={{ y: 20, opacity: 0 }}
                         animate={{ y: 0, opacity: 1 }}
                         className="text-[clamp(40px,8vw,48px)] font-black text-slate-900 font-display leading-none"
                       >
                         {price.toLocaleString('en-IN')}
                       </motion.span>
                       <span className="text-slate-400 font-bold ml-1">/month</span>
                    </div>
                    
                    <AnimatePresence mode="wait">
                      {isAnnual && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="flex flex-col gap-1 mb-4"
                        >
                          <p className="text-slate-400 text-xs font-bold line-through">Original: ₹{plan.price}/mo</p>
                          <p className="text-emerald-600 text-xs font-black uppercase tracking-widest">You save ₹{savings.toLocaleString('en-IN')}/year</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <p className="text-slate-600 text-base font-medium leading-relaxed mt-4">
                      {plan.tagline}
                    </p>
                    <p className="text-slate-400 text-xs mt-2 italic font-medium">
                      Best for: {plan.bestFor}
                    </p>
                  </div>

                  <div className="space-y-4 mb-10 flex-1">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-4 py-2 hover:translate-x-1 transition-transform">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                          isGrowth ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <Check className="w-3 h-3 stroke-[4px]" />
                        </div>
                        <span className="text-[15px] font-bold text-slate-700 leading-relaxed">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto">
                    <MagneticButton className="w-full" intensity={0.2}>
                      <button className={`w-full h-[56px] rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-xl flex items-center justify-center gap-2 group border-none cursor-pointer ${
                        isGrowth 
                          ? 'bg-brand-orange text-white shadow-orange-200/50 hover:shadow-orange-300/60' 
                          : 'bg-white border-2 border-indigo-600 text-indigo-600 shadow-indigo-100 hover:shadow-indigo-200'
                      }`}>
                        {plan.cta}
                        <motion.span 
                          animate={{ x: [0, 5, 0] }} 
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          →
                        </motion.span>
                      </button>
                    </MagneticButton>
                    <p className="text-center text-slate-400 text-[11px] font-bold mt-4 uppercase tracking-widest">
                      {plan.note}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Guarantee Strip (CHANGE 1) */}
        <div className="mt-24 pt-12 border-t border-slate-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
            {[
              "14-day free trial",
              "No credit card required",
              "We set it up for you",
              "Cancel anytime"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 justify-center md:justify-start">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Check className="w-3 h-3 stroke-[4px]" />
                </div>
                <span className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{text}</span>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="text-slate-400 text-xs font-medium flex items-center justify-center gap-2">
              <span className="text-slate-300">🔒</span> Your data is safe. We never share restaurant data.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
