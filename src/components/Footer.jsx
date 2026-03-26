import React from 'react';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Instagram, Linkedin, Twitter, MessageCircle, ArrowUp, Heart, Sparkles } from 'lucide-react';
import { NAV_LINKS } from '../constants';
import MagneticButton from './ui/MagneticButton';
import TextReveal from './ui/TextReveal';

export default function Footer() {
  const scrollTo = (href) => {
    if (href === '#') return;
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
    } else if (href === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const footerLinks = {
    Product: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Live Demo', href: '#demo' },
      { label: 'How It Works', href: '#how-it-works' },
    ],
    Company: [
      { label: 'About Us', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#contact' },
    ],
    Support: [
      { label: 'Help Center', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Refund Policy', href: '#' },
    ],
  };

  const socials = [
    { icon: Instagram, label: 'Instagram', color: 'hover:bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600' },
    { icon: Linkedin, label: 'LinkedIn', color: 'hover:bg-[#0077b5]' },
    { icon: Twitter, label: 'Twitter', color: 'hover:bg-[#1DA1F2]' },
    { icon: MessageCircle, label: 'WhatsApp', color: 'hover:bg-[#25D366]' },
  ];

  return (
    <footer className="bg-[#0F172A] pt-24 pb-12 px-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
      
      <div className="max-w-[1200px] mx-auto relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-16 mb-20 pb-20 border-b border-white/5">
          {/* Brand Column */}
          <div className="space-y-8">
            <motion.div 
              className="flex items-center gap-3 cursor-pointer group w-fit"
              onClick={() => scrollTo('top')}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-transform">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
              <span className="font-display font-black text-2xl text-white tracking-tighter">DineDeck</span>
            </motion.div>
            
            <p className="text-slate-400 text-lg leading-relaxed max-w-xs font-medium">
              Revolutionizing the Indian restaurant experience with soulful technology. 🚀
            </p>
            
            <div className="flex gap-4">
              {socials.map((s, i) => (
                <MagneticButton key={s.label} intensity={0.4}>
                  <a
                    href="#"
                    className={`w-12 h-12 bg-slate-900 border border-white/5 rounded-xl flex items-center justify-center text-slate-400 transition-all duration-300 hover:text-white hover:border-transparent hover:shadow-xl ${s.color} group`}
                  >
                    <s.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </a>
                </MagneticButton>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="space-y-8">
              <p className="font-black text-white text-xs uppercase tracking-[0.2em] font-display">{title}</p>
              <div className="flex flex-col gap-4">
                {links.map((link, i) => (
                  <motion.button
                    key={link.label}
                    onClick={() => scrollTo(link.href)}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="text-slate-500 text-sm text-left hover:text-indigo-400 transition-all bg-transparent border-none cursor-pointer p-0 py-2 font-bold hover:pl-2"
                  >
                    {link.label}
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
            <span>Made with</span>
            <motion.div 
              animate={{ scale: [1, 1.3, 1] }} 
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            </motion.div>
            <span>in Bhubaneswar</span>
          </div>
          
          <p className="text-slate-600 text-[13px] font-black uppercase tracking-widest">
            © 2025 DineDeck Technologies · All Rights Reserved
          </p>
          
          <MagneticButton intensity={0.5}>
            <button 
              onClick={() => scrollTo('top')}
              className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/50 hover:bg-indigo-500 transition-colors group"
            >
              <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
            </button>
          </MagneticButton>
        </div>
      </div>
      
      {/* Decorative stars */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-indigo-500/10 pointer-events-none"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 3 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        >
          <Sparkles className="w-8 h-8" />
        </motion.div>
      ))}
    </footer>
  );
}
