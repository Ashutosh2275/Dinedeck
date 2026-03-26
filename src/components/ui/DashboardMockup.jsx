import React from 'react';
import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';

export default function DashboardMockup() {
  const bars = [55, 70, 45, 85, 60, 95, 40];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const orders = [
    { id: '#1042', table: 'T-4', amount: '840', status: 'Served', color: 'bg-emerald-500' },
    { id: '#1043', table: 'T-7', amount: '1260', status: 'Preparing', color: 'bg-orange-500' },
    { id: '#1044', table: 'T-2', amount: '560', status: 'Ready', color: 'bg-indigo-500' },
  ];

  const stats = [
    { label: "Today's Revenue", value: 24580, prefix: '₹', change: '↑ 12%', changeColor: 'text-emerald-400' },
    { label: 'Orders', value: 47, prefix: '', change: '↑ 8%', changeColor: 'text-emerald-400' },
    { label: 'Avg Order', value: 523, prefix: '₹', change: '→ 0%', changeColor: 'text-yellow-400' },
  ];

  return (
    <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-[0_40px_100px_rgba(79,70,229,0.3)] relative overflow-hidden group">
      {/* Aurora Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <motion.div 
          className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] bg-indigo-600/20 blur-[100px] rounded-full"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute -bottom-[20%] -right-[20%] w-[60%] h-[60%] bg-violet-600/20 blur-[100px] rounded-full"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      {/* Window dots */}
      <div className="flex gap-2 mb-5 relative z-10">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-5 relative z-10">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label} 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3.5 border border-slate-700/50"
          >
            <p className="text-slate-400 text-[11px] mb-1">{stat.label}</p>
            <p className="text-white font-bold text-xl font-display">
              {stat.prefix}<AnimatedCounter target={stat.value} />
            </p>
            <span className={`text-[11px] ${stat.changeColor}`}>{stat.change}</span>
          </motion.div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="flex gap-3 items-end h-[100px] px-1 mb-4 relative z-10">
        {bars.map((h, i) => (
          <motion.div 
            key={i} 
            initial={{ height: 0 }}
            whileInView={{ height: `${h}%` }}
            transition={{ type: 'spring', damping: 15, stiffness: 100, delay: 0.5 + i * 0.1 }}
            className="flex-1 rounded-t-md relative group/bar"
            style={{
              background: i === 5 ? 'linear-gradient(to top, #F97316, #fb923c)' : 'linear-gradient(to top, #4F46E5, #818cf8)',
            }}
          >
            <motion.div 
              className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap"
            >
              {h}% Growth
            </motion.div>
          </motion.div>
        ))}
      </div>
      <div className="flex justify-between px-1 mb-4 relative z-10">
        {days.map((d, i) => (
          <span key={d} className={`text-[10px] ${i === 5 ? 'text-orange-500 font-bold' : 'text-slate-500'}`}>{d}</span>
        ))}
      </div>

      {/* Orders table */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700/50 relative z-10">
        <div className="grid grid-cols-4 px-3.5 py-2.5 border-b border-slate-700/50 bg-slate-800/80">
          {['Order', 'Table', 'Amount', 'Status'].map((h) => (
            <span key={h} className="text-slate-400 text-[11px] font-medium">{h}</span>
          ))}
        </div>
        {orders.map((order, i) => (
          <motion.div 
            key={order.id} 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 + i * 0.1 }}
            className={`grid grid-cols-4 px-3.5 py-3 ${i < orders.length - 1 ? 'border-b border-slate-700/30' : ''} hover:bg-slate-700/30 transition-colors`}
          >
            <span className="text-slate-200 text-xs font-medium">{order.id}</span>
            <span className="text-slate-300 text-xs">{order.table}</span>
            <span className="text-slate-100 text-xs font-bold">₹{order.amount}</span>
            <div className="flex items-center">
              <span className={`${order.color} text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider`}>
                {order.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Live feel cursor */}
      <motion.div 
        className="absolute w-1 h-4 bg-indigo-500/50 rounded-full z-20 pointer-events-none"
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 1 }}
        style={{ left: '20px', bottom: '60px' }}
      />
    </div>
  );
}
