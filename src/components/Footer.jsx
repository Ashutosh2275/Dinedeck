import { UtensilsCrossed, Instagram, Linkedin, Twitter, MessageCircle } from 'lucide-react'
import { NAV_LINKS } from '../constants'

export default function Footer() {
  const scrollTo = (href) => {
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

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
  }

  const socials = [
    { icon: Instagram, label: 'IG' },
    { icon: Linkedin, label: 'In' },
    { icon: Twitter, label: 'X' },
    { icon: MessageCircle, label: 'WA', hoverBg: 'hover:bg-[#25D366]' },
  ]

  return (
    <footer className="bg-brand-dark-bg pt-16 pb-8 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-12 mb-12 pb-12 border-b border-slate-800">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-indigo to-brand-indigo-dark rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-[18px] h-[18px] text-white" />
              </div>
              <span className="font-display font-extrabold text-lg text-white">DineDeck</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">Built for Indian Restaurants 🇮🇳</p>
            <div className="flex gap-2.5">
              {socials.map((s) => {
                const Icon = s.icon
                return (
                  <a
                    key={s.label}
                    href="#"
                    className={`w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 text-sm transition-all hover:bg-brand-indigo hover:text-white ${s.hoverBg || ''}`}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <p className="font-bold text-white text-sm mb-4 font-display">{title}</p>
              <div className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => scrollTo(link.href)}
                    className="text-slate-400 text-sm text-left hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0"
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-slate-500 text-[13px]">
          Made with ❤️ in Bhubaneswar · © 2025 DineDeck Technologies. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
