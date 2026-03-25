import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import ScrollReveal from './ui/ScrollReveal'
import { HOW_IT_WORKS_STEPS } from '../constants'

const stepVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-brand-surface">
      <div className="max-w-[900px] mx-auto text-center">
        <ScrollReveal>
          <h2 className="text-[clamp(32px,4vw,48px)] font-extrabold tracking-[-1.5px] text-slate-900 mb-3 font-display">Up and Running in 3 Steps</h2>
          <p className="text-slate-500 text-lg mb-16">Most restaurants go live in under 60 minutes</p>
        </ScrollReveal>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Connecting dashed line */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-[repeating-linear-gradient(90deg,#c7d2fe_0_8px,transparent_8px_16px)] z-0" />

          {HOW_IT_WORKS_STEPS.map((step) => (
            <motion.div key={step.number} variants={stepVariants} className="text-center relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-indigo to-indigo-400 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl text-white font-extrabold font-display border-4 border-brand-surface">
                {step.number}
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2 font-display">{step.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <ScrollReveal delay={0.3}>
          <div className="mt-12 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl py-5 px-8 inline-flex gap-3 items-center border border-indigo-200">
            <Zap className="w-6 h-6 text-brand-indigo" />
            <span className="text-brand-indigo-dark font-bold text-base">Average setup time: <strong className="text-brand-indigo">47 minutes</strong></span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
