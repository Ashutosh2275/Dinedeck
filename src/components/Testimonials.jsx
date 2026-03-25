import { motion } from 'framer-motion'
import ScrollReveal from './ui/ScrollReveal'
import { TESTIMONIALS } from '../constants'

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

export default function Testimonials() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-[1100px] mx-auto text-center">
        <ScrollReveal>
          <h2 className="text-[clamp(32px,4vw,48px)] font-extrabold tracking-[-1.5px] text-slate-900 mb-12 font-display">What Restaurant Owners Say</h2>
        </ScrollReveal>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              variants={cardVariants}
              className="bg-gradient-to-br from-slate-50 to-indigo-50 border border-indigo-100 rounded-2xl p-8 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(79,70,229,0.1)]"
            >
              <div className="text-amber-400 text-lg mb-4 tracking-[4px]">
                {'★'.repeat(t.stars)}
              </div>
              <p className="text-slate-700 text-[15px] leading-[1.7] mb-5 italic">"{t.quote}"</p>
              <div className="border-t border-indigo-100 pt-4">
                <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                <p className="text-slate-500 text-[13px]">{t.city}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
