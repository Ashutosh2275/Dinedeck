import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { Check, ArrowUpRight, TrendingUp, CreditCard, Smartphone, Monitor, Sparkles } from 'lucide-react';
import ScrollReveal from './ui/ScrollReveal';
import { FEATURE_DEEPDIVES } from '../constants';
import AnimatedCounter from './ui/AnimatedCounter';

/* ─── 3D Tilt Wrapper ─── */
function TiltWrapper({ children }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className="relative"
    >
      {children}
    </motion.div>
  );
}



/* ─── Visual: POS Invoice ─── */
function POSVisual() {
  return (
    <TiltWrapper>
      <div className="bg-slate-100 rounded-3xl p-8 border border-slate-200 shadow-2xl relative overflow-hidden group">
        <motion.div 
          className="bg-white rounded-2xl p-6 shadow-xl relative z-10 border border-slate-100"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="font-black text-xs text-indigo-600 uppercase tracking-widest mb-1">Invoice</p>
              <p className="font-black text-xl text-slate-900 font-display">#1045</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-slate-400" />
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {[
              { item: '2× Paneer Butter Masala', price: 560 },
              { item: '1× Garlic Naan', price: 60 },
              { item: '1× Mango Lassi', price: 120 },
            ].map((row, i) => (
              <motion.div 
                key={row.item} 
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                className="flex justify-between border-b border-slate-50 pb-3"
              >
                <span className="text-slate-500 font-bold text-sm">{row.item}</span>
                <span className="font-black text-slate-900 text-sm font-display">₹<AnimatedCounter target={row.price} /></span>
              </motion.div>
            ))}
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between"><span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Subtotal</span><span className="text-slate-500 font-bold text-xs">₹740</span></div>
            <div className="flex justify-between"><span className="text-slate-400 text-xs font-bold uppercase tracking-wider">GST (5%)</span><span className="text-slate-500 font-bold text-xs">₹37</span></div>
          </div>

          <div className="flex justify-between border-t-2 border-slate-900 pt-4 mb-6">
            <span className="font-black text-slate-900 uppercase tracking-tighter text-sm">Amount Due</span>
            <span className="font-black text-slate-900 text-2xl font-display tracking-tight">₹<AnimatedCounter target={777} /></span>
          </div>

          <div className="flex gap-2">
            {['UPI', 'Cash', 'Card'].map((p, i) => (
              <motion.span 
                key={p}
                whileHover={{ y: -2 }}
                className={`flex-1 text-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${
                  i === 0 ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                }`}
              >
                {p}
              </motion.span>
            ))}
          </div>
        </motion.div>
        
        {/* Floating background elements */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 blur-3xl rounded-full"
        />
      </div>
    </TiltWrapper>
  );
}

/* ─── Visual: QR Menu ─── */
function QRVisual() {
  const items = [
    { name: 'Paneer Tikka', price: 220, gradient: 'from-amber-400 to-amber-500' },
    { name: 'Veg Spring Roll', price: 180, gradient: 'from-orange-500 to-orange-600' },
    { name: 'Chicken 65', price: 260, gradient: 'from-rose-500 to-rose-600', sold: true },
  ];

  return (
    <TiltWrapper>
      <div className="relative flex justify-center group">
        <motion.div 
          className="w-64 h-[480px] rounded-[40px] border-[6px] border-slate-900 bg-slate-950 relative overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.4)] z-10"
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-slate-900 rounded-b-3xl z-30" />
          <div className="pt-12 px-4 bg-white h-full rounded-[34px] overflow-hidden flex flex-col">
            <div className="mb-6">
              <p className="font-black text-base text-slate-900 font-display">🍽️ Palace Kitchen</p>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Table 3 · Digital Menu</p>
            </div>

            <div className="flex gap-2 mb-6 overscroll-none">
              {['Starters', 'Mains'].map((c, i) => (
                <span key={c} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${i === 0 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-500'}`}>{c}</span>
              ))}
            </div>

            <div className="space-y-3 flex-1">
              {items.map((item, i) => (
                <motion.div 
                  key={item.name} 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="bg-slate-50 rounded-2xl p-3 flex gap-3 items-center border border-slate-100"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex-shrink-0 shadow-sm`} />
                  <div className="flex-1">
                    <p className="font-black text-xs text-slate-800">{item.name}</p>
                    <p className="text-indigo-600 font-black text-xs mt-0.5">₹<AnimatedCounter target={item.price} /></p>
                  </div>
                  {item.sold ? (
                    <span className="px-2 py-1 bg-slate-200 rounded-lg text-slate-500 text-[9px] font-black uppercase tracking-tighter">Sold Out</span>
                  ) : (
                    <motion.span 
                      whileTap={{ scale: 0.9 }}
                      className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-lg font-black shadow-lg shadow-indigo-100 cursor-pointer"
                    >
                      +
                    </motion.span>
                  )}
                </motion.div>
              ))}
            </div>
            
            <div className="py-6 mt-auto">
              <button className="w-full py-3 bg-brand-orange text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-100">
                View Cart (3)
              </button>
            </div>
          </div>
        </motion.div>
        
        {/* Floating Ring Decor */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border-2 border-indigo-100 rounded-full pointer-events-none opacity-50 z-0"
        />
      </div>
    </TiltWrapper>
  );
}

/* ─── Visual: Kitchen KDS ─── */
function KitchenVisual() {
  return (
    <TiltWrapper>
      <div className="bg-slate-950 rounded-3xl p-6 border-4 border-slate-900 shadow-2xl font-mono text-slate-300 relative overflow-hidden group">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <motion.div 
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            />
            <span className="text-white font-black text-xs tracking-widest uppercase">KDS Live Terminal</span>
          </div>
          <motion.span 
            className="text-indigo-400 text-xs font-bold"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            3 ORDERS ACTIVE
          </motion.span>
        </div>

        <div className="space-y-4">
          {[
            { table: 'T-5 · Order #1047', items: '1× Veg Thali · 2× Garlic Roti', status: 'NEW', border: 'border-rose-500', bg: 'bg-rose-500', flash: true },
            { table: 'T-3 · Order #1046', items: '2× Biryani · 1× Raita', status: 'PREPARING', border: 'border-orange-500', bg: 'bg-orange-500' },
            { table: 'T-1 · Order #1045', items: '1× Dal Makhani', status: 'READY', border: 'border-emerald-500', bg: 'bg-emerald-500' },
          ].map((order, i) => (
            <motion.div 
              key={order.table} 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className={`bg-slate-900/50 rounded-xl p-4 border-l-[4px] ${order.border} flex justify-between items-center group/order hover:bg-slate-800 transition-colors shadow-lg`}
            >
              <div>
                <p className="text-white font-black text-sm tracking-tight">{order.table}</p>
                <p className="text-slate-500 text-[11px] font-bold mt-1">{order.items}</p>
                <p className="text-indigo-500/50 text-[9px] mt-2">Placed 2 mins ago</p>
              </div>
              <span className={`${order.bg} text-white px-3 py-1 rounded-lg text-[9px] font-black tracking-widest shadow-lg ${order.flash ? 'animate-pulse' : ''}`}>
                {order.status}
              </span>
            </motion.div>
          ))}
        </div>
        
        {/* Glow effect */}
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-600/10 blur-[80px] rounded-full pointer-events-none" />
      </div>
    </TiltWrapper>
  );
}

/* ─── Visual: Analytics ─── */
function AnalyticsVisual() {
  const bars = [50, 65, 40, 72, 55, 80, 48];
  return (
    <TiltWrapper>
      <div className="bg-slate-100 rounded-3xl p-8 border border-slate-200 shadow-2xl relative overflow-hidden">
        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 group"
          >
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span>Growth</span>
            </div>
            <p className="font-black text-3xl text-slate-900 font-display tracking-tight">₹<AnimatedCounter target={1.2} suffix="L" /></p>
            <span className="text-emerald-500 text-[11px] font-black mt-1 inline-block">↑ 18.5% Growth</span>
          </motion.div>
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-indigo-600 rounded-2xl p-5 shadow-lg shadow-indigo-100 group relative overflow-hidden"
          >
            <div className="flex items-center gap-2 text-white/60 text-[10px] font-black uppercase tracking-widest mb-3 relative z-10">
              <Sparkles className="w-3 h-3 text-white" />
              <span>Top Dish</span>
            </div>
            <p className="font-black text-lg text-white font-display tracking-tight leading-tight relative z-10">Paneer Butter Masala</p>
            <span className="text-white/80 text-[11px] font-bold mt-2 inline-block relative z-10">42 orders today</span>
            
            {/* Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:10px_10px]" />
          </motion.div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-50">
          <div className="flex justify-between items-center mb-6">
            <p className="font-black text-sm text-slate-900 uppercase tracking-widest">Revenue Forecast</p>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-slate-200" />)}
            </div>
          </div>
          <div className="flex gap-3 items-end h-28 px-2">
            {bars.map((h, i) => (
              <motion.div 
                key={i} 
                className="flex-1 flex flex-col items-center gap-3 group/bar"
                initial={{ height: 0 }}
                whileInView={{ height: '100%' }}
                transition={{ delay: 0.3 + i * 0.1, type: 'spring' }}
              >
                <motion.div
                  className={`w-full rounded-t-lg relative transition-all duration-300 group-hover/bar:scale-x-110 ${
                    i === 5 ? 'bg-gradient-to-t from-orange-500 to-orange-400 shadow-lg shadow-orange-100' : 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-lg shadow-indigo-100'
                  }`}
                  style={{ height: `${h}%` }}
                >
                  <motion.div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 bg-slate-900 text-white text-[9px] px-2 py-1 rounded font-black whitespace-nowrap pointer-events-none">
                    ₹{h * 2}k
                  </motion.div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </TiltWrapper>
  );
}

const visualMap = { POSVisual, QRVisual, KitchenVisual, AnalyticsVisual };

export default function FeatureDeepDive() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const bgColor = useTransform(
    scrollYProgress,
    [0, 0.2, 0.5, 0.8, 1],
    ["#ffffff", "#f8fafc", "#ffffff", "#f8fafc", "#ffffff"]
  );

  return (
    <motion.section 
      ref={containerRef}
      style={{ backgroundColor: bgColor }}
      className="py-32 px-6 transition-colors duration-700"
    >
      <div className="max-w-[1200px] mx-auto">
        {FEATURE_DEEPDIVES.map((feature, idx) => {
          const Visual = visualMap[feature.visual];
          const isReversed = idx % 2 === 1;
          
          return (
            <div 
              key={feature.title} 
              className={`grid grid-cols-1 md:grid-cols-2 gap-20 lg:gap-32 items-center mb-32 last:mb-0`}
            >
              <div className={`${isReversed ? 'md:order-2' : ''}`}>
                <ScrollReveal variant={isReversed ? "fadeLeft" : "fadeRight"}>
                  <div className="mb-8">
                    <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em]">
                      Module 0{idx + 1}
                    </span>
                  </div>
                  <h2 className="text-[clamp(32px,5vw,52px)] font-black tracking-[-2px] text-slate-900 mb-8 font-display leading-[1.1]">
                    {feature.title}
                  </h2>
                  <div className="flex flex-col gap-5">
                    {feature.bullets.map((bullet, bIdx) => (
                      <motion.div 
                        key={bullet} 
                        initial={{ opacity: 0, x: isReversed ? 20 : -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * bIdx + 0.3, type: "spring" }}
                        viewport={{ once: true }}
                        className="flex items-start gap-4 group"
                      >
                        <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                          <Check className="w-4 h-4 stroke-[3px]" />
                        </div>
                        <span className="text-slate-600 text-lg font-medium leading-relaxed group-hover:text-slate-900 transition-colors">
                          {bullet}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                  
                  <motion.button 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-12 flex items-center gap-3 text-slate-900 font-black text-sm uppercase tracking-widest hover:gap-5 transition-all group"
                  >
                    View detailed spec <span className="text-xl text-indigo-600">→</span>
                  </motion.button>
                </ScrollReveal>
              </div>

              <div className={`${isReversed ? 'md:order-1' : ''}`}>
                <ScrollReveal variant={isReversed ? "fadeRight" : "fadeLeft"} delay={0.2} duration={1}>
                  <Visual />
                </ScrollReveal>
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
