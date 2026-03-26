import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, ShoppingBag, PieChart, LayoutGrid, 
  TrendingUp, Users, Clock, Check, Search, Plus, Filter, ArrowUpRight 
} from 'lucide-react';
import ScrollReveal from './ui/ScrollReveal';
import GlowCard from './ui/GlowCard';
import AnimatedCounter from './ui/AnimatedCounter';

export default function DashboardPreview() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'analytics', label: 'Stats', icon: BarChart3 },
    { id: 'menu', label: 'Menu', icon: PieChart },
  ];

  return (
    <section className="py-24 px-4 bg-slate-900 overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-brand-orange/10 blur-[120px] rounded-full translate-y-1/2" />

      <div className="max-w-[1200px] mx-auto relative z-10">
        <ScrollReveal variant="blur">
          <div className="text-center mb-16">
            <h2 className="text-[clamp(36px,5vw,52px)] font-black tracking-[-2px] text-white mb-6 font-display">
              Control Your Restaurant from Anywhere
            </h2>
            <p className="text-slate-400 text-xl max-w-[700px] mx-auto font-medium">
              The only dashboard you'll ever need. Powerful, intuitive, and lightning-fast.
            </p>
          </div>
        </ScrollReveal>

        {/* Dashboard Shell */}
        <div className="bg-slate-950 rounded-[40px] border border-slate-800 shadow-[0_50px_100px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Header/Tabs */}
          <div className="border-b border-slate-800 p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all relative overflow-hidden group border-none cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="active-dash-tab" 
                      className="absolute inset-0 bg-indigo-600 z-0"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-2">
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="hidden md:flex items-center gap-4 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
               Live Updates Active
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 md:p-10 min-h-[500px] relative">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && <OverviewTab key="overview" />}
              {activeTab === 'orders' && <OrdersTab key="orders" />}
              {activeTab === 'analytics' && <AnalyticsTab key="analytics" />}
              {activeTab === 'menu' && <MenuTab key="menu" />}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── TAB 1: OVERVIEW ─── */
function OverviewTab() {
  const stats = [
    { label: "Today's Revenue", val: 18420, trend: "+12%", color: "text-emerald-500", prefix: "₹" },
    { label: "Orders Today", val: 143, trend: "+8%", color: "text-emerald-500" },
    { label: "Avg Order Value", val: 128, trend: "Stable", color: "text-indigo-400", prefix: "₹" },
    { label: "Active Tables", val: 12, suffix: "/20", trend: "Live", color: "text-amber-500" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }}
      className="space-y-10"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl hover:bg-slate-900 transition-colors group">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3">{s.label}</p>
            <div className="flex items-baseline gap-1">
              {s.prefix && <span className="text-slate-400 text-lg font-black">{s.prefix}</span>}
              <span className="text-2xl md:text-3xl font-black text-white font-display">
                <AnimatedCounter target={s.val} />
              </span>
              {s.suffix && <span className="text-slate-600 text-sm font-bold">{s.suffix}</span>}
            </div>
            <p className={`${s.color} text-[10px] font-black mt-3 uppercase tracking-widest flex items-center gap-1`}>
              {s.trend !== 'Live' && <TrendingUp className="w-3 h-3" />}
              {s.trend}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 p-8 rounded-[32px]">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-white font-black text-sm uppercase tracking-widest">Revenue (Last 7 Days)</h4>
            <div className="flex gap-2">
               {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="text-[10px] font-black text-slate-600">{d}</span>)}
            </div>
          </div>
          <div className="flex items-end justify-between h-40 gap-3 px-2">
            {[40, 65, 45, 80, 55, 95, 75].map((h, i) => (
              <motion.div 
                key={i} 
                initial={{ height: 0 }} 
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.1, type: "spring" }}
                className={`flex-1 rounded-t-lg relative group ${i === 5 ? 'bg-brand-orange shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'bg-indigo-600'}`}
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[10px] font-black px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                   ₹{(h * 200).toLocaleString()}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[32px]">
          <h4 className="text-white font-black text-sm uppercase tracking-widest mb-8">Recent Activity</h4>
          <div className="space-y-6">
            {[
              { msg: "Table 4 ordered", time: "2 min ago", icon: Clock },
              { msg: "Bill printed for Table 7", time: "5 min ago", icon: Check },
              { msg: "New QR order received", time: "8 min ago", icon: ShoppingBag },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 group cursor-default">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <item.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">{item.msg}</p>
                  <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── TAB 2: ORDERS ─── */
function OrdersTab() {
  const orders = [
    { id: '#1042', table: 'Table 4', items: 'Paneer Tikka, Naan x2', amount: 420, status: 'SERVED', color: 'bg-emerald-500', time: '12:34 PM' },
    { id: '#1043', table: 'Table 7', items: 'Chicken Biryani x2', amount: 560, status: 'PREPARING', color: 'bg-orange-500', time: '12:41 PM' },
    { id: '#1044', table: 'Table 2', items: 'Masala Dosa, Coffee', amount: 180, status: 'READY', color: 'bg-indigo-500', time: '12:45 PM' },
    { id: '#1045', table: 'Table 9', items: 'Thali x3, Lassi x3', amount: 975, status: 'PREPARING', color: 'bg-orange-500', time: '12:48 PM' },
    { id: '#1046', table: 'Table 1', items: 'Veg Manchurian, Rice', amount: 340, status: 'NEW', color: 'bg-rose-500 animate-pulse', time: '12:51 PM' },
    { id: '#1047', table: 'QR T-6', items: 'Caesar Salad, Pepsi', amount: 220, status: 'NEW', color: 'bg-rose-500 animate-pulse', time: '12:52 PM' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="space-y-6 h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {['All', 'New', 'Preparing', 'Ready', 'Served'].map((f, i) => (
            <button key={f} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-800 transition-colors ${i === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-900/50 text-slate-500 hover:text-slate-300'} cursor-pointer`}>
              {f}
            </button>
          ))}
        </div>
        <p className="hidden md:block text-slate-500 text-[10px] font-black uppercase tracking-widest">8 of 143 orders</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/80">
              {['Order', 'Table', 'Items', 'Amount', 'Status', 'Time'].map(h => (
                <th key={h} className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => (
              <tr key={i} className="border-t border-slate-800/50 hover:bg-slate-900/60 transition-colors">
                <td className="p-5 text-white font-black text-sm sticky left-0 bg-slate-950/80 backdrop-blur-sm">{o.id}</td>
                <td className="p-5 text-slate-300 font-bold text-sm">{o.table}</td>
                <td className="p-5 text-slate-400 font-medium text-xs max-w-[150px] truncate">{o.items}</td>
                <td className="p-5 text-white font-black text-sm">₹{o.amount}</td>
                <td className="p-5">
                   <span className={`${o.color} text-white px-3 py-1 rounded-lg text-[9px] font-black tracking-widest shadow-lg`}>
                      {o.status}
                   </span>
                </td>
                <td className="p-5 text-slate-500 font-bold text-[10px] uppercase tracking-tighter">{o.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* ─── TAB 3: ANALYTICS ─── */
function AnalyticsTab() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-8"
    >
      <div className="space-y-6">
        <div className="bg-indigo-600 rounded-[32px] p-8 relative overflow-hidden group">
           <div className="relative z-10">
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-4">Best Selling Dish</p>
              <h4 className="text-white text-3xl font-black font-display mb-2">Paneer Butter Masala</h4>
              <div className="flex items-center gap-4">
                 <p className="text-white/80 font-bold text-sm">34 orders today</p>
                 <div className="h-4 w-px bg-white/20" />
                 <p className="text-white font-black text-lg">₹11,900</p>
              </div>
           </div>
           <PieChart className="absolute -bottom-10 -right-10 w-48 h-48 text-white/10 group-hover:rotate-12 transition-transform duration-700" />
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[32px]">
           <h4 className="text-white font-black text-sm uppercase tracking-widest mb-8">Top 5 Dishes</h4>
           <div className="space-y-6 text-white font-bold text-sm leading-none">
              {[
                { name: 'Paneer Butter Masala', rev: '11,900', p: 85 },
                { name: 'Chicken Biryani', rev: '15,680', p: 70 },
                { name: 'Masala Dosa', rev: '3,960', p: 55 },
                { name: 'Dal Makhani', rev: '5,510', p: 40 },
                { name: 'Veg Thali', rev: '8,500', p: 35 },
              ].map((d, i) => (
                <div key={i} className="space-y-3">
                   <div className="flex justify-between">
                      <span className="flex items-center gap-3">
                        <span className="text-slate-500 font-black">{i+1}</span>
                        {d.name}
                      </span>
                      <span className="text-slate-400">₹{d.rev}</span>
                   </div>
                   <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} whileInView={{ width: `${d.p}%` }} 
                        className={`h-full ${i === 0 ? 'bg-brand-orange' : 'bg-indigo-600'}`} 
                      />
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[32px] flex flex-col">
         <div className="flex justify-between items-center mb-10">
            <h4 className="text-white font-black text-sm uppercase tracking-widest">Revenue This Week</h4>
            <span className="text-emerald-500 text-[10px] font-black bg-emerald-500/10 px-3 py-1 rounded-full uppercase">↑ 18% vs Last</span>
         </div>
         <p className="text-white text-5xl font-black font-display mb-12">₹1,24,800</p>
         <div className="flex-1 flex items-end justify-between gap-1 h-full min-h-[200px]">
            {[20, 35, 25, 45, 60, 85, 95, 100, 90, 75, 55, 40, 30, 20].map((h, i) => (
              <motion.div 
                key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }}
                className={`flex-1 rounded-t-sm ${i > 7 && i < 11 ? 'bg-brand-orange' : 'bg-indigo-600/50'}`}
              />
            ))}
         </div>
         <div className="flex justify-between mt-4 text-slate-500 text-[9px] font-black uppercase">
            <span>9 AM</span>
            <span>2 PM</span>
            <span>7 PM</span>
            <span>11 PM</span>
         </div>
      </div>
    </motion.div>
  );
}

/* ─── TAB 4: MENU ─── */
function MenuTab() {
  const [items, setItems] = useState([
    { name: 'Paneer Butter Masala', price: 350, available: true, color: 'from-amber-400 to-amber-500' },
    { name: 'Chicken Biryani', price: 560, available: true, color: 'from-orange-500 to-orange-600' },
    { name: 'Masala Dosa', price: 180, available: true, color: 'from-violet-400 to-violet-600' },
    { name: 'Garlic Naan', price: 60, available: false, color: 'from-rose-500 to-rose-600' },
    { name: 'Mango Lassi', price: 120, available: true, color: 'from-emerald-400 to-emerald-600' },
    { name: 'Gulab Jamun', price: 90, available: true, color: 'from-pink-400 to-pink-500' },
  ]);

  const toggleAvailability = (idx) => {
    const newItems = [...items];
    newItems[idx].available = !newItems[idx].available;
    setItems(newItems);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row gap-6 justify-between md:items-center">
        <div className="relative flex-1 max-w-md group">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400" />
           <input 
             type="text" 
             placeholder="Search menu items..." 
             className="w-full h-12 bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-indigo-600 transition-all"
           />
        </div>
        <div className="flex gap-4">
           <button className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/20 border-none cursor-pointer">
              <Plus className="w-4 h-4" /> Add New
           </button>
           <button className="h-12 w-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500 hover:text-white cursor-pointer transition-colors">
              <Filter className="w-4 h-4" />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {items.map((item, i) => (
          <div key={i} className={`bg-slate-900/50 border rounded-3xl p-5 flex flex-col gap-4 border-slate-800 transition-all group ${!item.available ? 'opacity-50 grayscale' : ''}`}>
             <div className="flex justify-between items-start">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} shadow-lg relative overflow-hidden`}>
                   <div className="absolute inset-0 bg-white/10 group-hover:scale-150 transition-transform duration-700" />
                </div>
                <div 
                  onClick={() => toggleAvailability(i)}
                  className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors relative ${item.available ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <motion.div 
                    animate={{ x: item.available ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="w-4 h-4 bg-white rounded-full shadow-md"
                  />
                </div>
             </div>
             <div className="flex-1">
                <p className="text-white font-black text-sm mb-1">{item.name}</p>
                <p className="text-indigo-400 font-black text-sm">₹{item.price}</p>
             </div>
             <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
                <span className={`text-[9px] font-black uppercase tracking-widest ${item.available ? 'text-emerald-500' : 'text-slate-500'}`}>
                   {item.available ? '✓ Available' : '× Sold Out'}
                </span>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Main Course</p>
             </div>
          </div>
        ))}
      </div>
      
      <div className="text-center pt-6">
         <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
            24 items in menu · 2 sold out
         </p>
      </div>
    </motion.div>
  );
}
