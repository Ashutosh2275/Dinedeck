import React from 'react';
import { motion } from 'framer-motion';

const variants = {
  fadeUp: {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
  },
  fadeDown: {
    initial: { opacity: 0, y: -60 },
    animate: { opacity: 1, y: 0 },
  },
  fadeLeft: {
    initial: { opacity: 0, x: 80 },
    animate: { opacity: 1, x: 0 },
  },
  fadeRight: {
    initial: { opacity: 0, x: -80 },
    animate: { opacity: 1, x: 0 },
  },
  scaleUp: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
  },
  blur: {
    initial: { opacity: 0, filter: 'blur(20px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
  },
};

const ScrollReveal = ({ children, variant = "fadeUp", delay = 0, duration = 0.8, className = "" }) => {
  const selectedVariant = variants[variant] || variants.fadeUp;

  return (
    <motion.div
      initial={selectedVariant.initial}
      whileInView={selectedVariant.animate}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1], // Expo out
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
