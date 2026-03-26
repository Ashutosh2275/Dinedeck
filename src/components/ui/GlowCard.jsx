import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const GlowCard = ({ children, className = "" }) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    mouseX.set(x);
    mouseY.set(y);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-2xl border border-slate-200/20 bg-white/5 p-8 transition-colors duration-300 glow-card ${
        isHovered ? 'border-indigo-500/50' : ''
      } ${className}`}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(79, 70, 229, 0.15), transparent 60%)`
          ),
          opacity: isHovered ? 1 : 0,
        }}
      />
      {children}
    </motion.div>
  );
};

export default GlowCard;
