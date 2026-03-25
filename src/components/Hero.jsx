import { motion } from 'framer-motion'
import ScrollReveal from './ui/ScrollReveal'
import GradientBadge from './ui/GradientBadge'
import DashboardMockup from './ui/DashboardMockup'

export default function Hero() {
  const scrollTo = (href) => {
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="min-h-screen pt-[140px] pb-20 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="dot-grid absolute inset-0 opacity-[0.15] animate-dot-pulse z-0" />
      <div className="absolute -top-[100px] -right-[100px] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(79,70,229,0.15),transparent_70%)] z-0" />

      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[55%_45%] gap-12 items-center relative z-10">
        {/* Left column */}
        <div>
          <ScrollReveal>
            <GradientBadge>
              <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block animate-pulse-dot" />
              <span>Now live in Bhubaneswar &amp; Cuttack</span>
            </GradientBadge>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <h1 className="text-[clamp(40px,5vw,72px)] font-extrabold leading-[1.05] tracking-[-2px] text-slate-900 mt-6 mb-6 font-display">
              Run Your Entire Restaurant From One Smart Screen
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p className="text-[clamp(16px,1.8vw,20px)] text-slate-500 leading-[1.7] mb-9 max-w-[540px]">
              POS billing · QR ordering · Kitchen tickets · Analytics — DineDeck replaces 5 tools with one beautiful dashboard built for Indian restaurants.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="flex gap-4 flex-wrap mb-6">
              <button onClick={() => scrollTo('#pricing')} className="glow-btn inline-flex items-center gap-2 px-8 py-4 bg-brand-orange text-white rounded-[10px] font-bold text-base font-display border-none cursor-pointer">
                Start Free Trial <span>→</span>
              </button>
              <button onClick={() => scrollTo('#demo')} className="inline-flex items-center gap-2 px-8 py-4 border-2 border-slate-200 text-slate-800 rounded-[10px] font-semibold text-base font-display hover:border-brand-indigo hover:text-brand-indigo transition-all bg-white cursor-pointer">
                Watch How It Works ▶
              </button>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.4}>
            <div className="flex gap-5 flex-wrap text-slate-500 text-sm">
              <span>✓ 14-day free trial</span>
              <span>✓ No credit card</span>
              <span>✓ Setup in 60 minutes</span>
            </div>
          </ScrollReveal>
        </div>

        {/* Right column — Dashboard */}
        <ScrollReveal delay={0.3} className="hidden lg:block">
          <motion.div
            animate={{ y: [0, -16, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <DashboardMockup />
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  )
}
