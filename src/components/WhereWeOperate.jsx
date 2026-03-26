import React from 'react';
import { MapPin, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import ScrollReveal from './ui/ScrollReveal';
import TextReveal from './ui/TextReveal';
import GlowCard from './ui/GlowCard';

export default function WhereWeOperate() {
  const cities = [
    { 
      name: 'Bhubaneswar, Odisha', 
      tagline: 'Our home city. Growing fast.',
      color: 'from-indigo-500/20 to-indigo-600/20',
      delay: 0.1,
      direction: 'left'
    },
    { 
      name: 'Cuttack, Odisha', 
      tagline: 'The Silver City. Now on DineDeck.',
      color: 'from-blue-500/20 to-blue-600/20',
      delay: 0.2,
      direction: 'right'
    },
  ];

  return (
    <section className="py-32 px-6 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-50/50 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-[1000px] mx-auto text-center relative z-10">
        <ScrollReveal variant="blur">
          <div className="flex justify-center mb-6">
            <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em]">
              Availability
            </span>
          </div>
          <h2 className="text-[clamp(36px,5vw,52px)] font-black tracking-[-2px] text-slate-900 mb-6 font-display leading-tight">
            Currently Live In
          </h2>
          <p className="text-slate-500 text-xl mb-16 max-w-[600px] mx-auto font-medium">
            Growing across Odisha, one restaurant at a time. We're bringing the tech revolution to your neighborhood.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-[800px] mx-auto mb-16 px-4">
          {cities.map((city, i) => (
            <ScrollReveal 
              key={city.name} 
              variant={city.direction === 'left' ? 'fadeRight' : 'fadeLeft'}
              delay={city.delay}
            >
              <GlowCard className="group relative">
                <motion.div 
                  className={`absolute inset-0 bg-gradient-to-br ${city.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} 
                />
                
                <div className="relative z-10 flex flex-col items-center py-6">
                  <motion.div 
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200, delay: city.delay + 0.3 }}
                    className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6 border border-slate-100 group-hover:border-indigo-200 transition-colors"
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <MapPin className="w-8 h-8 text-indigo-600 fill-indigo-50" />
                    </motion.div>
                  </motion.div>
                  
                  <h3 className="text-2xl font-black text-slate-900 mb-3 font-display tracking-tight group-hover:text-indigo-600 transition-colors">
                    {city.name}
                  </h3>
                  <p className="text-indigo-600 font-bold text-sm tracking-tight px-4 opacity-80 group-hover:opacity-100 transition-opacity">
                    {city.tagline}
                  </p>
                  
                  <motion.div 
                    className="mt-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Live & Operating</span>
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                  </motion.div>
                </div>
              </GlowCard>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal variant="fadeUp" delay={0.4}>
          <div className="flex flex-col items-center gap-4">
            <TextReveal 
              text="Expanding across Odisha and beyond in 2025" 
              by="char" 
              className="text-slate-500 text-lg font-bold font-display"
            />
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
              className="text-4xl"
            >
              🚀
            </motion.div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
