import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, LayoutGroup } from 'framer-motion';
import { UtensilsCrossed, Menu, X, ArrowRight } from 'lucide-react';
import { NAV_LINKS } from '../constants';
import MagneticButton from './ui/MagneticButton';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);
  const { scrollY } = useScroll();
  
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 0.92]);
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 1]);
  const blurValue = useTransform(scrollY, [0, 80], ['blur(0px)', 'blur(12px)']);

  const scrollTo = (href) => {
    setMobileOpen(false);
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
    <>
      <motion.nav
        id="navbar"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="fixed top-0 left-0 right-0 z-50 py-4 transition-all duration-300"
        style={{
          backgroundColor: useTransform(bgOpacity, (v) => `rgba(255,255,255,${v})`),
          borderBottom: useTransform(borderOpacity, (v) => `1px solid rgba(226,232,240,${v})`),
          backdropFilter: blurValue,
        }}
      >
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <motion.a 
            href="#" 
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} 
            className="flex items-center gap-2.5 no-underline group"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div 
              className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[10px] flex items-center justify-center shadow-lg shadow-indigo-200/50"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <motion.div
                animate={{ rotate: [-5, 5] }}
                transition={{ repeat: Infinity, repeatType: "reverse", duration: 3 }}
              >
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </motion.div>
            </motion.div>
            <span className="font-display font-extrabold text-[22px] text-slate-800 tracking-tight flex overflow-hidden">
              {"DineDeck".split("").map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.05, type: 'spring', damping: 12 }}
                >
                  {char}
                </motion.span>
              ))}
            </span>
          </motion.a>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            <LayoutGroup>
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  onMouseEnter={() => setHoveredLink(link.href)}
                  onMouseLeave={() => setHoveredLink(null)}
                  className="relative text-slate-500 hover:text-indigo-600 font-medium text-[15px] transition-colors bg-transparent border-none cursor-pointer py-2 group overflow-hidden"
                >
                  <div className="relative overflow-hidden h-[22px]">
                    <motion.span
                      className="block transition-transform duration-300 group-hover:-translate-y-full"
                    >
                      {link.label}
                    </motion.span>
                    <motion.span
                      className="absolute top-0 left-0 block translate-y-full transition-transform duration-300 group-hover:translate-y-0 text-indigo-600"
                    >
                      {link.label}
                    </motion.span>
                  </div>
                  {hoveredLink === link.href && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"
                      transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                    />
                  )}
                </button>
              ))}
            </LayoutGroup>
          </div>

          {/* Desktop buttons */}
          <div className="hidden md:flex items-center gap-4">
            <MagneticButton intensity={0.2}>
              <button 
                onClick={() => scrollTo('#contact')} 
                className="px-5 py-2.5 border-[1.5px] border-indigo-600 text-indigo-600 rounded-xl font-semibold text-sm font-display hover:bg-indigo-50 transition-all bg-transparent cursor-pointer"
              >
                Book a Demo
              </button>
            </MagneticButton>
            <MagneticButton intensity={0.3}>
              <button 
                onClick={() => scrollTo('#pricing')} 
                className="relative overflow-hidden group px-6 py-2.5 bg-brand-orange text-white rounded-xl font-semibold text-sm font-display border-none cursor-pointer shadow-lg shadow-orange-200"
              >
                <span className="relative z-10">Get Started</span>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                  animate={{ translateX: ['100%', '-100%'] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 1 }}
                />
              </button>
            </MagneticButton>
          </div>

          {/* Mobile hamburger (min 44x44px) */}
          <button 
            onClick={() => setMobileOpen(true)} 
            className="md:hidden flex flex-col items-center justify-center gap-[5px] bg-transparent border-none cursor-pointer w-11 h-11 group"
            aria-label="Open Menu"
          >
            <motion.span 
              animate={{ width: 24 }}
              className="w-6 h-0.5 bg-slate-800 rounded-sm" 
            />
            <motion.span 
              animate={{ width: 24 }}
              className="w-6 h-0.5 bg-slate-800 rounded-sm" 
            />
            <motion.span 
              animate={{ width: 18 }}
              className="w-[18px] h-0.5 bg-slate-800 rounded-sm group-hover:w-6 transition-all" 
            />
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-10"
          >
            <button 
              onClick={() => setMobileOpen(false)} 
              className="absolute top-8 right-8 bg-slate-100 p-3 rounded-full border-none cursor-pointer hover:bg-slate-200 transition-colors"
            >
              <X className="w-6 h-6 text-slate-800" />
            </button>
            
            <div className="flex flex-col items-center gap-6">
              {NAV_LINKS.map((link, i) => (
                <motion.button
                  key={link.href}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05, type: 'spring' }}
                  onClick={() => scrollTo(link.href)}
                  className="w-full h-[56px] text-slate-800 font-display text-3xl font-bold bg-transparent border-none cursor-pointer hover:text-indigo-600 transition-colors flex items-center justify-center"
                >
                  {link.label}
                </motion.button>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col gap-4 w-full px-12"
            >
              <button 
                onClick={() => scrollTo('#contact')} 
                className="w-full py-4 border-2 border-indigo-600 text-indigo-600 rounded-2xl font-bold font-display bg-transparent cursor-pointer text-lg"
              >
                Book a Demo
              </button>
              <button 
                onClick={() => scrollTo('#pricing')} 
                className="w-full py-4 bg-brand-orange text-white rounded-2xl font-bold font-display border-none cursor-pointer text-lg shadow-xl shadow-orange-200"
              >
                Get Started
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
