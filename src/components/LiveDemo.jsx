import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ScrollReveal from './ui/ScrollReveal'
import { DEMO_STEPS } from '../constants'

/* ─── Phone Mockup Shell ─── */
function PhoneMockup({ children }) {
  return (
    <div className="w-[280px] h-[520px] rounded-[36px] border-4 border-slate-800 bg-[#0f172a] relative overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.3)] mx-auto">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-6 bg-slate-800 rounded-b-2xl z-10" />
      {children}
    </div>
  )
}

/* ─── Step 0: QR Scan ─── */
function ScanQR() {
  const qrCells = [
    1,0,1,0,1,1,1, 1,1,0,1,0,1,0, 0,1,1,0,1,0,1,
    1,0,1,1,0,1,1, 1,1,0,1,1,0,0, 0,1,1,0,1,1,1,
    1,0,1,1,0,1,0,
  ]
  return (
    <PhoneMockup>
      <div className="pt-12 px-6 flex flex-col items-center justify-center h-full">
        <div className="w-40 h-40 bg-white rounded-xl p-3 relative overflow-hidden">
          <div className="grid grid-cols-7 gap-[3px]">
            {qrCells.map((cell, i) => (
              <div key={i} className={`aspect-square rounded-sm ${cell ? 'bg-slate-800' : 'bg-transparent'}`} />
            ))}
          </div>
          <div className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-scan-line" style={{ top: '10%', position: 'absolute' }} />
        </div>
        <p className="text-white font-bold mt-5 font-display text-base">Scan to Order</p>
        <p className="text-slate-400 text-[13px] mt-1">Table 4 · DineDeck</p>
      </div>
    </PhoneMockup>
  )
}

/* ─── Step 1: Menu ─── */
function ViewMenu() {
  const items = [
    { name: 'Paneer Butter Masala', desc: 'Rich, creamy curry', price: '₹280', gradient: 'from-amber-400 to-amber-500' },
    { name: 'Garlic Naan', desc: 'Fresh from tandoor', price: '₹60', gradient: 'from-orange-500 to-orange-600' },
    { name: 'Mango Lassi', desc: 'Chilled & creamy', price: '₹120', gradient: 'from-violet-400 to-violet-600' },
    { name: 'Veg Biryani', desc: 'Aromatic basmati rice', price: '₹220', gradient: 'from-emerald-400 to-emerald-600' },
  ]
  return (
    <PhoneMockup>
      <div className="pt-10 px-4 bg-white h-full overflow-hidden rounded-[32px]">
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {['All', 'Starters', 'Main Course', 'Breads'].map((cat, i) => (
            <span key={cat} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${i === 0 ? 'bg-brand-indigo text-white' : 'bg-slate-100 text-slate-500'}`}>{cat}</span>
          ))}
        </div>
        {items.map((item, i) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-gradient-to-br from-slate-50 to-slate-200 rounded-xl p-3 mb-2 flex gap-3 items-center"
          >
            <div className={`w-14 h-14 rounded-[10px] bg-gradient-to-br ${item.gradient} flex-shrink-0`} />
            <div className="flex-1">
              <p className="font-bold text-sm text-slate-800">{item.name}</p>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
            <p className="font-bold text-brand-indigo text-sm whitespace-nowrap">{item.price}</p>
          </motion.div>
        ))}
      </div>
    </PhoneMockup>
  )
}

/* ─── Step 2: Order Cart ─── */
function PlaceOrder() {
  const cartItems = [
    { name: '2× Paneer Butter Masala', note: 'Creamy, medium spice', price: '₹560' },
    { name: '1× Garlic Naan', note: 'Extra butter', price: '₹60' },
    { name: '1× Mango Lassi', note: 'Chilled', price: '₹120' },
  ]
  return (
    <PhoneMockup>
      <div className="pt-10 px-4 bg-white h-full rounded-[32px]">
        <p className="font-extrabold text-lg text-slate-800 mb-4 font-display">Your Order</p>
        {cartItems.map((item) => (
          <div key={item.name} className="bg-slate-50 rounded-xl p-3.5 mb-2.5 flex justify-between items-center border border-slate-200">
            <div>
              <p className="font-semibold text-sm text-slate-800">{item.name}</p>
              <p className="text-xs text-slate-500">{item.note}</p>
            </div>
            <p className="font-bold text-slate-800 text-sm">{item.price}</p>
          </div>
        ))}
        <div className="border-t-2 border-dashed border-slate-200 pt-3.5 mt-2 mb-5">
          <div className="flex justify-between mb-1.5"><span className="text-slate-500 text-[13px]">Subtotal</span><span className="font-semibold text-[13px] text-slate-800">₹740</span></div>
          <div className="flex justify-between mb-1.5"><span className="text-slate-500 text-[13px]">GST (5%)</span><span className="font-semibold text-[13px] text-slate-800">₹37</span></div>
          <div className="flex justify-between"><span className="font-bold text-[15px] text-slate-900">Total</span><span className="font-extrabold text-[15px] text-slate-900">₹777</span></div>
        </div>
        <button className="w-full py-3.5 bg-brand-orange text-white rounded-xl font-bold text-base font-display border-none cursor-pointer animate-glow-pulse">
          Place Order →
        </button>
      </div>
    </PhoneMockup>
  )
}

/* ─── Step 3: Kitchen KOT ─── */
function KitchenKOT() {
  return (
    <div className="w-[340px] min-h-[400px] bg-gray-900 rounded-xl p-5 font-mono text-gray-200 border-2 border-gray-700 mx-auto">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
        <span className="text-emerald-500 font-bold text-sm">● KITCHEN DISPLAY</span>
        <span className="text-gray-500 text-xs">14:23:05</span>
      </div>
      {/* New order */}
      <div className="bg-gray-800 rounded-lg p-4 mb-3 border-l-4 border-red-500">
        <div className="flex justify-between items-center mb-3">
          <span className="text-white font-bold text-base">TABLE 4</span>
          <span className="kot-flash bg-red-500 text-white px-2.5 py-0.5 rounded text-[11px] font-bold">NEW</span>
        </div>
        <div className="text-gray-300 text-sm leading-8">
          <div className="flex justify-between"><span>2× Paneer Butter Masala</span><span className="text-slate-400">₹560</span></div>
          <div className="flex justify-between"><span>1× Garlic Naan</span><span className="text-slate-400">₹60</span></div>
          <div className="flex justify-between"><span>1× Mango Lassi</span><span className="text-slate-400">₹120</span></div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-dashed border-gray-600 flex justify-between">
          <span className="text-gray-400 text-xs">Order #1045</span>
          <span className="text-gray-400 text-xs">2:23 PM</span>
        </div>
      </div>
      {/* Preparing */}
      <div className="bg-gray-800 rounded-lg p-4 mb-3 border-l-4 border-yellow-500">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white font-bold">TABLE 7</span>
          <span className="bg-yellow-500 text-white px-2.5 py-0.5 rounded text-[11px] font-bold">PREPARING</span>
        </div>
        <div className="text-gray-300 text-sm leading-8"><span>1× Chicken Biryani</span><br /><span>2× Butter Naan</span></div>
      </div>
      {/* Ready */}
      <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-emerald-500">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white font-bold">TABLE 2</span>
          <span className="bg-emerald-500 text-white px-2.5 py-0.5 rounded text-[11px] font-bold">READY</span>
        </div>
        <div className="text-gray-300 text-sm leading-8"><span>1× Masala Dosa</span><br /><span>1× Filter Coffee</span></div>
      </div>
    </div>
  )
}

/* ─── Visuals map ─── */
const stepVisuals = [ScanQR, ViewMenu, PlaceOrder, KitchenKOT]

/* ─── Main Component ─── */
export default function LiveDemo() {
  const [activeStep, setActiveStep] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef(null)

  const resetTimer = () => {
    clearInterval(timerRef.current)
    if (!paused) {
      timerRef.current = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % 4)
      }, 4000)
    }
  }

  useEffect(() => {
    resetTimer()
    return () => clearInterval(timerRef.current)
  }, [paused])

  const goToStep = (n) => {
    setActiveStep(n)
    resetTimer()
  }

  const Visual = stepVisuals[activeStep]
  const step = DEMO_STEPS[activeStep]

  const scrollTo = (href) => {
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="demo" className="py-24 px-6 bg-brand-surface">
      <div className="max-w-[1100px] mx-auto text-center">
        <ScrollReveal>
          <h2 className="text-[clamp(32px,4vw,48px)] font-extrabold tracking-[-1.5px] text-slate-900 mb-3 font-display">See DineDeck In Action</h2>
          <p className="text-slate-500 text-lg mb-12">From scan to serve — watch the complete order flow</p>
        </ScrollReveal>

        {/* Step tabs */}
        <ScrollReveal delay={0.1}>
          <div className="flex justify-center gap-2 mb-12 flex-wrap">
            {DEMO_STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <button
                  onClick={() => goToStep(i)}
                  className={`px-6 py-2.5 rounded-full border-2 font-semibold text-sm cursor-pointer font-display transition-all ${
                    activeStep === i
                      ? 'bg-brand-indigo border-brand-indigo text-white'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-brand-indigo'
                  }`}
                >
                  {s.tab}
                </button>
                {i < 3 && (
                  <div className="w-10 h-[3px] bg-slate-200 rounded overflow-hidden hidden sm:block">
                    <div
                      className="h-full bg-gradient-to-r from-brand-indigo to-brand-orange rounded transition-all duration-300"
                      style={{ width: i < activeStep ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Demo content */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center text-left min-h-[520px]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`visual-${activeStep}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
              className="flex justify-center"
            >
              <Visual />
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${activeStep}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="p-5"
            >
              <span className="inline-block bg-indigo-50 text-brand-indigo px-3.5 py-1 rounded-full text-[13px] font-semibold mb-4">{step.badge}</span>
              <h3 className="text-[28px] font-extrabold text-slate-900 mb-3 tracking-[-0.5px] font-display">{step.title}</h3>
              <p className="text-slate-500 text-base leading-[1.7]">{step.subtitle}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom CTA */}
        <ScrollReveal delay={0.2} className="mt-12">
          <p className="text-slate-500 text-base mb-5">This entire flow takes under <strong className="text-slate-900">60 seconds</strong></p>
          <button onClick={() => scrollTo('#pricing')} className="glow-btn inline-flex items-center gap-2 px-8 py-4 bg-brand-orange text-white rounded-[10px] font-bold text-base font-display border-none cursor-pointer">
            Try It At Your Restaurant →
          </button>
        </ScrollReveal>
      </div>
    </section>
  )
}
