import { motion, AnimatePresence } from 'framer-motion';
import ScrollReveal from './ui/ScrollReveal';
import GlowCard from './ui/GlowCard';
import { TESTIMONIALS } from '../constants';
import { Star, Quote, CheckCircle } from 'lucide-react';

export default function Testimonials() {
  return (
    <section className="py-32 px-6 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-slate-50/50 blur-[130px] rounded-full pointer-events-none" />
      
      <div className="max-w-[1200px] mx-auto text-center relative z-10">
        <ScrollReveal variant="blur">
          <div className="flex justify-center mb-6">
            <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100">
              Success Stories
            </span>
          </div>
          <h2 className="text-[clamp(36px,5vw,52px)] font-black tracking-[-2px] text-slate-900 mb-6 font-display leading-tight">
            What Restaurant Owners Say
          </h2>
          <p className="text-slate-500 text-xl mb-20 max-w-[600px] mx-auto font-medium">
            Join 200+ restaurants across Odisha that have transformed their operations with DineDeck.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 perspective-[2000px]">
          {TESTIMONIALS.map((t, i) => {
            const rotation = i === 0 ? -5 : i === 2 ? 5 : 0;
            return (
              <ScrollReveal 
                key={i} 
                variant="fadeUp" 
                delay={i * 0.1}
                className="h-full"
              >
                <div className="h-full">
                  <motion.div
                    initial={{ rotateY: rotation, opacity: 0, y: 50 }}
                    whileInView={{ rotateY: 0, opacity: 1, y: 0 }}
                    transition={{ 
                      type: 'spring', 
                      damping: 15, 
                      stiffness: 100,
                      delay: i * 0.1 
                    }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="h-full"
                  >
                    <GlowCard className="h-full flex flex-col p-10 !rounded-[32px] !bg-white border-slate-100 shadow-xl shadow-slate-200/50 group hover:-translate-y-3 transition-all duration-500">
                      <div className="flex gap-1 mb-8">
                        {[...Array(5)].map((_, starIdx) => (
                          <motion.div
                            key={starIdx}
                            initial={{ scale: 0, rotate: -30 }}
                            whileInView={{ scale: 1, rotate: 0 }}
                            transition={{ 
                              type: 'spring', 
                              damping: 12, 
                              stiffness: 200, 
                              delay: 0.5 + i * 0.1 + starIdx * 0.05 
                            }}
                          >
                            <Star className={`w-5 h-5 ${starIdx < t.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} group-hover:scale-110 transition-transform`} />
                          </motion.div>
                        ))}
                      </div>

                      <div className="relative mb-8 flex-1">
                        <Quote className="absolute -top-4 -left-4 w-10 h-10 text-indigo-50 group-hover:text-indigo-100 transition-colors -z-10" />
                        <p className="text-slate-600 text-[17px] leading-relaxed font-medium italic relative z-10 group-hover:text-slate-900 transition-colors">
                          "{t.quote}"
                        </p>
                      </div>

                      <div className="pt-8 border-t border-slate-50 mt-auto flex items-center justify-between">
                        <div className="text-left">
                          <p className="font-black text-slate-900 font-display text-base tracking-tight">{t.name}</p>
                          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">{t.city}</p>
                        </div>
                        <motion.div 
                          className="flex flex-col items-center gap-1"
                          initial={{ opacity: 0, x: 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1 + i * 0.1 }}
                        >
                          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Verified</span>
                        </motion.div>
                      </div>
                    </GlowCard>
                  </motion.div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Improved mobile indicators (simulated) */}
        <div className="flex md:hidden justify-center gap-2 mt-12">
          {TESTIMONIALS.map((_, i) => (
            <motion.div 
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${i === 0 ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
