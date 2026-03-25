import { motion } from 'framer-motion'
import ScrollReveal from './ui/ScrollReveal'
import { FEATURES } from '../constants'

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

export default function FeaturesGrid() {
  return (
    <section id="features" className="py-24 px-6 bg-brand-surface">
      <div className="max-w-[1200px] mx-auto text-center">
        <ScrollReveal>
          <h2 className="text-[clamp(32px,4vw,48px)] font-extrabold tracking-[-1.5px] text-slate-900 mb-3 font-display">Everything Your Restaurant Needs</h2>
          <p className="text-slate-500 text-lg mb-14">One platform. Every tool. Zero complexity.</p>
        </ScrollReveal>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 text-left"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                variants={cardVariants}
                className="bg-white rounded-2xl p-7 border border-slate-200 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(79,70,229,0.12)] cursor-default"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-[17px] text-slate-900 mb-2 font-display">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
