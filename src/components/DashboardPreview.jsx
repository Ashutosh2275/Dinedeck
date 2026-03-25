import { useState } from 'react'
import { motion } from 'framer-motion'
import ScrollReveal from './ui/ScrollReveal'

const tabs = ['Overview', 'Orders', 'Analytics', 'Menu']

export default function DashboardPreview() {
  const [activeTab, setActiveTab] = useState(0)

  const bars = [60, 80, 50, 100, 70, 120, 55]
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const orders = [
    { id: '#1067', table: 'T-4', status: 'Served', bg: 'bg-emerald-500' },
    { id: '#1068', table: 'T-7', status: 'Preparing', bg: 'bg-orange-500' },
    { id: '#1069', table: 'T-2', status: 'Ready', bg: 'bg-blue-500' },
    { id: '#1070', table: 'T-9', status: 'New', bg: 'bg-red-500' },
  ]

  return (
    <section className="py-24 px-6 bg-brand-dark-bg">
      <div className="max-w-[1200px] mx-auto text-center">
        <ScrollReveal>
          <h2 className="text-[clamp(32px,4vw,48px)] font-extrabold tracking-[-1.5px] text-white mb-3 font-display">Your Entire Restaurant. One Screen.</h2>
          <p className="text-slate-400 text-lg mb-12">Real-time data. Every order. Every table. Every rupee.</p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-[0_40px_80px_rgba(0,0,0,0.4)]">
            {/* Tabs */}
            <div className="flex gap-1 mb-6">
              {tabs.map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(i)}
                  className={`px-5 py-2 rounded-lg font-semibold text-[13px] font-display border-none cursor-pointer transition-all ${
                    activeTab === i ? 'bg-brand-indigo text-white' : 'bg-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Today's Revenue", value: '₹34,850', change: '↑ 15% vs yesterday', color: 'text-emerald-400' },
                { label: 'Total Orders', value: '67', change: '↑ 12 more', color: 'text-emerald-400' },
                { label: 'Avg Order Value', value: '₹520', change: '→ Stable', color: 'text-yellow-400' },
                { label: 'Active Tables', value: '8/12', change: '67% occupied', color: 'text-orange-400' },
              ].map((stat) => (
                <div key={stat.label} className="bg-brand-dark-bg rounded-xl p-5 border border-slate-700">
                  <p className="text-slate-500 text-xs mb-1">{stat.label}</p>
                  <p className="text-white font-extrabold text-[28px] font-display">{stat.value}</p>
                  <span className={`text-xs font-semibold ${stat.color}`}>{stat.change}</span>
                </div>
              ))}
            </div>

            {/* Chart + Orders */}
            <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-4">
              {/* Bar chart */}
              <div className="bg-brand-dark-bg rounded-xl p-5 border border-slate-700">
                <p className="text-slate-200 font-bold text-sm mb-4 text-left">Weekly Revenue</p>
                <div className="flex gap-2.5 items-end h-[120px] px-2">
                  {bars.map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <div
                        className="w-full rounded-t"
                        style={{
                          height: `${h}px`,
                          background: i === 5 ? 'linear-gradient(to top,#F97316,#fb923c)' : 'linear-gradient(to top,#4F46E5,#818cf8)',
                        }}
                      />
                      <span className={`text-[10px] ${i === 5 ? 'text-orange-500 font-bold' : 'text-slate-500'}`}>{days[i]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent orders */}
              <div className="bg-brand-dark-bg rounded-xl p-5 border border-slate-700">
                <p className="text-slate-200 font-bold text-sm mb-3 text-left">Recent Orders</p>
                <div className="flex flex-col gap-2">
                  {orders.map((order) => (
                    <div key={order.id} className="flex justify-between items-center px-3 py-2 bg-slate-800 rounded-lg">
                      <div>
                        <span className="text-slate-200 text-xs font-semibold">{order.id}</span>
                        <span className="text-slate-500 text-[11px] ml-2">{order.table}</span>
                      </div>
                      <span className={`${order.bg} text-white text-[10px] px-2 py-0.5 rounded-full`}>{order.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
