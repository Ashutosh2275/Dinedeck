import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import ScrollReveal from './ui/ScrollReveal'
import { PRICING_PLANS } from '../constants'

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false)

  const scrollTo = (href) => {
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="pricing" className="py-24 px-6 bg-brand-surface">
      <div className="max-w-[1000px] mx-auto text-center">
        <ScrollReveal>
          <h2 className="text-[clamp(32px,4vw,48px)] font-extrabold tracking-[-1.5px] text-slate-900 mb-3 font-display">Simple Pricing. No Surprises.</h2>
          <p className="text-slate-500 text-lg mb-8">Start free for 14 days. No credit card needed.</p>
        </ScrollReveal>

        {/* Toggle */}
        <ScrollReveal delay={0.1}>
          <div className="inline-flex bg-slate-200 rounded-full p-1 mb-12">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold font-display border-none cursor-pointer transition-all ${
                !isAnnual ? 'bg-white text-slate-900 shadow-sm' : 'bg-transparent text-slate-500'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold font-display border-none cursor-pointer transition-all ${
                isAnnual ? 'bg-white text-slate-900 shadow-sm' : 'bg-transparent text-slate-500'
              }`}
            >
              Annual <span className="text-emerald-500 text-xs ml-1">Save 20%</span>
            </button>
          </div>
        </ScrollReveal>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PRICING_PLANS.map((plan, i) => (
            <ScrollReveal key={plan.name} delay={i * 0.1}>
              <div className={`bg-white rounded-[20px] p-10 text-left relative transition-all duration-300 hover:-translate-y-2 ${
                plan.popular
                  ? 'border-2 border-brand-indigo shadow-[0_20px_40px_rgba(79,70,229,0.1)] hover:shadow-[0_25px_50px_rgba(79,70,229,0.15)]'
                  : 'border border-slate-200 hover:shadow-[0_25px_50px_rgba(79,70,229,0.15)]'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-brand-orange to-orange-400 text-white px-4 py-1.5 rounded-full text-xs font-bold font-display">
                    🏷️ Most Popular
                  </div>
                )}
                <p className="font-bold text-lg text-slate-900 mb-2 font-display">{plan.name}</p>
                <p className="text-slate-500 text-sm mb-5">{plan.subtitle}</p>
                <div className="mb-6">
                  <span className="font-extrabold text-[40px] text-slate-900 font-display">
                    ₹{(isAnnual ? plan.annual : plan.monthly).toLocaleString('en-IN')}
                  </span>
                  <span className="text-slate-500 text-sm">/month</span>
                </div>
                <div className="flex flex-col gap-3 mb-8">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-slate-600 text-sm">{f}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => scrollTo('#contact')}
                  className={`w-full py-3.5 rounded-[10px] font-bold text-[15px] font-display border-none cursor-pointer transition-all ${
                    plan.popular
                      ? 'glow-btn bg-brand-orange text-white'
                      : 'border-2 border-brand-indigo text-brand-indigo hover:bg-brand-indigo hover:text-white bg-transparent'
                  }`}
                  style={plan.popular ? {} : { border: '2px solid #4F46E5' }}
                >
                  Start Free Trial
                </button>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.2}>
          <p className="text-slate-500 text-sm mt-8">✓ 14-day free trial · ✓ No credit card · ✓ Cancel anytime · ✓ We help you onboard</p>
        </ScrollReveal>
      </div>
    </section>
  )
}
