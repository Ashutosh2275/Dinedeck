import ScrollReveal from './ui/ScrollReveal'

export default function FinalCTA() {
  const scrollTo = (href) => {
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="py-24 px-6 bg-gradient-to-br from-brand-indigo-dark via-brand-indigo to-indigo-400 relative overflow-hidden">
      {/* Dot pattern */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} />

      <div className="max-w-[800px] mx-auto text-center relative z-10">
        <ScrollReveal>
          <h2 className="text-[clamp(32px,4.5vw,56px)] font-extrabold tracking-[-2px] text-white mb-4 font-display">Ready to Transform Your Restaurant?</h2>
          <p className="text-white/80 text-lg mb-10">Join the restaurants in Bhubaneswar and Cuttack already running smarter with DineDeck</p>
          <div className="flex gap-4 justify-center flex-wrap mb-6">
            <button onClick={() => scrollTo('#pricing')} className="glow-btn px-9 py-4 bg-brand-orange text-white rounded-[10px] font-bold text-base font-display border-none cursor-pointer">
              Get Started Free →
            </button>
            <button onClick={() => scrollTo('#contact')} className="px-9 py-4 border-2 border-white/50 text-white rounded-[10px] font-semibold text-base font-display bg-transparent cursor-pointer hover:bg-white/10 hover:border-white transition-all">
              Book a Live Demo
            </button>
          </div>
          <p className="text-white/60 text-sm">Setup in 60 minutes · We onboard you personally · No hidden fees</p>
        </ScrollReveal>
      </div>
    </section>
  )
}
