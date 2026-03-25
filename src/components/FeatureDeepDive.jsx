import { Check } from 'lucide-react'
import ScrollReveal from './ui/ScrollReveal'
import { FEATURE_DEEPDIVES } from '../constants'

/* ─── Visual: POS Invoice ─── */
function POSVisual() {
  return (
    <div className="bg-brand-surface rounded-2xl p-6 border border-slate-200">
      <div className="bg-white rounded-xl p-5 border border-slate-200">
        <p className="font-bold text-sm text-slate-900 mb-4 font-display">Invoice #1045</p>
        {[
          { item: '2× Paneer Butter Masala', price: '₹560' },
          { item: '1× Garlic Naan', price: '₹60' },
          { item: '1× Mango Lassi', price: '₹120' },
        ].map((row) => (
          <div key={row.item} className="flex justify-between border-b border-slate-100 pb-2 mb-2">
            <span className="text-slate-500 text-[13px]">{row.item}</span>
            <span className="font-semibold text-[13px]">{row.price}</span>
          </div>
        ))}
        <div className="flex justify-between mb-1"><span className="text-slate-400 text-xs">Subtotal</span><span className="text-slate-500 text-xs">₹740</span></div>
        <div className="flex justify-between mb-1"><span className="text-slate-400 text-xs">CGST 2.5%</span><span className="text-slate-500 text-xs">₹18.50</span></div>
        <div className="flex justify-between mb-3"><span className="text-slate-400 text-xs">SGST 2.5%</span><span className="text-slate-500 text-xs">₹18.50</span></div>
        <div className="flex justify-between border-t-2 border-slate-900 pt-2.5">
          <span className="font-extrabold text-slate-900">Total</span>
          <span className="font-extrabold text-slate-900 text-lg">₹777</span>
        </div>
        <div className="flex gap-2 mt-4">
          <span className="bg-indigo-50 text-brand-indigo px-3 py-1.5 rounded-md text-[11px] font-semibold">💳 UPI</span>
          <span className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-md text-[11px] font-semibold">💵 Cash</span>
          <span className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-md text-[11px] font-semibold">💳 Card</span>
        </div>
      </div>
    </div>
  )
}

/* ─── Visual: QR Menu ─── */
function QRVisual() {
  const items = [
    { name: 'Paneer Tikka', price: '₹220', gradient: 'from-amber-400 to-amber-500' },
    { name: 'Veg Spring Roll', price: '₹180', gradient: 'from-orange-500 to-orange-600' },
    { name: 'Chicken 65', price: '₹260', gradient: 'from-red-500 to-red-600', sold: true },
  ]
  return (
    <div className="flex justify-center">
      <div className="w-60 h-[440px] rounded-[36px] border-[3px] border-slate-800 bg-[#0f172a] relative overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.3)]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-5 bg-slate-800 rounded-b-2xl z-10" />
        <div className="pt-8 px-3.5 bg-white h-full rounded-[28px] overflow-hidden">
          <p className="font-extrabold text-[15px] text-slate-900 mb-1 font-display">🍽️ Palace Kitchen</p>
          <p className="text-slate-400 text-[11px] mb-3">Table 3 · Digital Menu</p>
          <div className="flex gap-1.5 mb-3">
            {['Starters', 'Mains', 'Drinks'].map((c, i) => (
              <span key={c} className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${i === 0 ? 'bg-brand-indigo text-white' : 'bg-slate-100 text-slate-500'}`}>{c}</span>
            ))}
          </div>
          {items.map((item) => (
            <div key={item.name} className="bg-slate-50 rounded-lg p-2.5 mb-1.5 flex gap-2 items-center">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex-shrink-0`} />
              <div className="flex-1">
                <p className="font-semibold text-xs text-slate-800">{item.name}</p>
                <p className="text-[10px] text-slate-500">{item.price}</p>
              </div>
              {item.sold ? (
                <span className="w-6 h-6 bg-slate-200 rounded-md flex items-center justify-center text-slate-400 text-[10px]">Sold</span>
              ) : (
                <span className="w-6 h-6 bg-brand-indigo rounded-md flex items-center justify-center text-white text-xs">+</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Visual: Kitchen KDS ─── */
function KitchenVisual() {
  return (
    <div className="bg-gray-900 rounded-xl p-5 font-mono text-gray-200 border-2 border-gray-700">
      <div className="flex justify-between items-center mb-3"><span className="text-emerald-500 font-bold text-[13px]">● KDS LIVE</span><span className="text-gray-500 text-[11px]">3 active orders</span></div>
      {[
        { table: 'T-5 · Order #1047', items: '1× Thali · 2× Roti', status: 'NEW', border: 'border-red-500', bg: 'bg-red-500', flash: true },
        { table: 'T-3 · Order #1046', items: '2× Biryani · 1× Raita', status: 'PREPARING', border: 'border-yellow-500', bg: 'bg-yellow-500' },
        { table: 'T-1 · Order #1045', items: '1× Dal Makhani', status: 'READY', border: 'border-emerald-500', bg: 'bg-emerald-500' },
      ].map((order) => (
        <div key={order.table} className={`bg-gray-800 rounded-md p-3 mb-2 border-l-[3px] ${order.border} flex justify-between items-center`}>
          <div>
            <p className="text-white font-bold text-[13px]">{order.table}</p>
            <p className="text-gray-400 text-[11px]">{order.items}</p>
          </div>
          <span className={`${order.bg} text-white px-2 py-0.5 rounded text-[10px] font-bold ${order.flash ? 'kot-flash' : ''}`}>{order.status}</span>
        </div>
      ))}
    </div>
  )
}

/* ─── Visual: Analytics ─── */
function AnalyticsVisual() {
  const bars = [50, 65, 40, 72, 55, 80, 48]
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  return (
    <div className="bg-brand-surface rounded-2xl p-6 border border-slate-200">
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <p className="text-slate-400 text-[11px] mb-1">This Week</p>
          <p className="font-extrabold text-[22px] text-slate-900 font-display">₹1.2L</p>
          <span className="text-emerald-500 text-[11px] font-semibold">↑ 18% vs last week</span>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <p className="text-slate-400 text-[11px] mb-1">Top Dish</p>
          <p className="font-extrabold text-base text-slate-900 font-display">Paneer Butter Masala</p>
          <span className="text-slate-500 text-[11px]">42 orders this week</span>
        </div>
      </div>
      <p className="font-bold text-[13px] text-slate-900 mb-3">Daily Revenue</p>
      <div className="flex gap-2 items-end h-20">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t"
              style={{
                height: `${h}px`,
                background: i === 5 ? 'linear-gradient(to top,#F97316,#fb923c)' : 'linear-gradient(to top,#4F46E5,#818cf8)',
              }}
            />
            <span className={`text-[9px] ${i === 5 ? 'text-orange-500 font-bold' : 'text-slate-400'}`}>{days[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const visualMap = { pos: POSVisual, qr: QRVisual, kitchen: KitchenVisual, analytics: AnalyticsVisual }

export default function FeatureDeepDive() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-[1100px] mx-auto">
        {FEATURE_DEEPDIVES.map((feature, idx) => {
          const Visual = visualMap[feature.visual]
          const isReversed = idx % 2 === 1
          return (
            <ScrollReveal key={feature.title}>
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-24 last:mb-0 ${isReversed ? '' : ''}`}>
                <div className={isReversed ? 'md:order-2' : ''}>
                  <h2 className="text-[clamp(28px,3vw,40px)] font-extrabold tracking-[-1px] text-slate-900 mb-5 font-display">{feature.title}</h2>
                  <div className="flex flex-col gap-3">
                    {feature.bullets.map((bullet) => (
                      <div key={bullet} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <span className="text-slate-600 text-base">{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={isReversed ? 'md:order-1' : ''}>
                  <Visual />
                </div>
              </div>
            </ScrollReveal>
          )
        })}
      </div>
    </section>
  )
}
