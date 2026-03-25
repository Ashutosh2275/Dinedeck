import { MapPin } from 'lucide-react'
import ScrollReveal from './ui/ScrollReveal'

export default function WhereWeOperate() {
  const cities = [
    { name: 'Bhubaneswar, Odisha', tagline: 'Our home city. Growing fast.' },
    { name: 'Cuttack, Odisha', tagline: 'The Silver City. Now on DineDeck.' },
  ]

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-[900px] mx-auto text-center">
        <ScrollReveal>
          <h2 className="text-[clamp(28px,3.5vw,40px)] font-extrabold tracking-[-1px] text-slate-900 mb-3 font-display">Currently Live In</h2>
          <p className="text-slate-500 text-base mb-12">Growing across Odisha, one restaurant at a time</p>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-[700px] mx-auto">
          {cities.map((city, i) => (
            <ScrollReveal key={city.name} delay={i * 0.1}>
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-2xl py-9 px-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(79,70,229,0.12)] group">
                <div className="text-4xl mb-3">📍</div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-2 font-display">{city.name}</h3>
                <p className="text-brand-indigo font-semibold text-sm">{city.tagline}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.2}>
          <p className="text-slate-500 text-[15px] mt-8">Expanding across Odisha and beyond in 2025 🚀</p>
        </ScrollReveal>
      </div>
    </section>
  )
}
