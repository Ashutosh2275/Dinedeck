export default function DashboardMockup() {
  const bars = [55, 70, 45, 85, 60, 95, 40]
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const orders = [
    { id: '#1042', table: 'T-4', amount: '₹840', status: 'Served', color: 'bg-emerald-500' },
    { id: '#1043', table: 'T-7', amount: '₹1,260', status: 'Preparing', color: 'bg-orange-500' },
    { id: '#1044', table: 'T-2', amount: '₹560', status: 'Ready', color: 'bg-blue-500' },
  ]

  return (
    <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-[0_40px_100px_rgba(79,70,229,0.3)]">
      {/* Window dots */}
      <div className="flex gap-2 mb-5">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Today's Revenue", value: '₹24,580', change: '↑ 12%', changeColor: 'text-emerald-400' },
          { label: 'Orders', value: '47', change: '↑ 8%', changeColor: 'text-emerald-400' },
          { label: 'Avg Order', value: '₹523', change: '→ 0%', changeColor: 'text-yellow-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-800 rounded-xl p-3.5">
            <p className="text-slate-400 text-[11px] mb-1">{stat.label}</p>
            <p className="text-white font-bold text-xl font-display">{stat.value}</p>
            <span className={`text-[11px] ${stat.changeColor}`}>{stat.change}</span>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="flex gap-3 items-end h-[100px] px-1 mb-4">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-t-md"
            style={{
              height: `${h}%`,
              background: i === 5 ? 'linear-gradient(to top, #F97316, #fb923c)' : 'linear-gradient(to top, #4F46E5, #818cf8)',
            }}
          />
        ))}
      </div>
      <div className="flex justify-between px-1 mb-4">
        {days.map((d, i) => (
          <span key={d} className={`text-[10px] ${i === 5 ? 'text-orange-500 font-bold' : 'text-slate-500'}`}>{d}</span>
        ))}
      </div>

      {/* Orders table */}
      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-4 px-3.5 py-2.5 border-b border-slate-700">
          {['Order', 'Table', 'Amount', 'Status'].map((h) => (
            <span key={h} className="text-slate-400 text-[11px]">{h}</span>
          ))}
        </div>
        {orders.map((order, i) => (
          <div key={order.id} className={`grid grid-cols-4 px-3.5 py-2.5 ${i < orders.length - 1 ? 'border-b border-slate-700' : ''}`}>
            <span className="text-slate-200 text-xs">{order.id}</span>
            <span className="text-slate-200 text-xs">{order.table}</span>
            <span className="text-slate-200 text-xs">{order.amount}</span>
            <span className={`${order.color} text-white text-[10px] px-2 py-0.5 rounded-full w-fit`}>{order.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
