import { useState } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { UtensilsCrossed, Menu, X } from 'lucide-react'
import { NAV_LINKS } from '../constants'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { scrollY } = useScroll()
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 0.92])
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 1])

  const scrollTo = (href) => {
    setMobileOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <motion.nav
        id="navbar"
        className="fixed top-0 left-0 right-0 z-50 py-4"
        style={{
          backgroundColor: useTransform(bgOpacity, (v) => `rgba(255,255,255,${v})`),
          borderBottom: useTransform(borderOpacity, (v) => `1px solid rgba(226,232,240,${v})`),
          backdropFilter: useTransform(scrollY, [0, 80], ['blur(0px)', 'blur(12px)']),
        }}
      >
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="flex items-center gap-2.5 no-underline">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-indigo to-brand-indigo-dark rounded-[10px] flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-extrabold text-[22px] text-slate-800 tracking-tight">DineDeck</span>
          </a>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="text-slate-500 hover:text-brand-indigo font-medium text-[15px] transition-colors bg-transparent border-none cursor-pointer"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => scrollTo('#contact')} className="px-5 py-2.5 border-[1.5px] border-brand-indigo text-brand-indigo rounded-lg font-semibold text-sm font-display hover:bg-brand-indigo hover:text-white transition-all bg-transparent cursor-pointer">
              Book a Demo
            </button>
            <button onClick={() => scrollTo('#pricing')} className="glow-btn px-5 py-2.5 bg-brand-orange text-white rounded-lg font-semibold text-sm font-display border-none cursor-pointer">
              Get Started
            </button>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(true)} className="md:hidden flex flex-col gap-[5px] bg-transparent border-none cursor-pointer p-2">
            <span className="w-6 h-0.5 bg-slate-800 rounded-sm" />
            <span className="w-6 h-0.5 bg-slate-800 rounded-sm" />
            <span className="w-[18px] h-0.5 bg-slate-800 rounded-sm" />
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/97 backdrop-blur-xl flex flex-col items-center justify-center gap-8"
          >
            <button onClick={() => setMobileOpen(false)} className="absolute top-6 right-6 bg-transparent border-none cursor-pointer">
              <X className="w-7 h-7 text-white" />
            </button>
            {NAV_LINKS.map((link, i) => (
              <motion.button
                key={link.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                onClick={() => scrollTo(link.href)}
                className="text-white font-display text-2xl font-bold bg-transparent border-none cursor-pointer"
              >
                {link.label}
              </motion.button>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex gap-3 mt-4"
            >
              <button onClick={() => scrollTo('#contact')} className="px-6 py-3 border-2 border-white text-white rounded-lg font-semibold font-display bg-transparent cursor-pointer">
                Book a Demo
              </button>
              <button onClick={() => scrollTo('#pricing')} className="px-6 py-3 bg-brand-orange text-white rounded-lg font-semibold font-display border-none cursor-pointer">
                Get Started
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
