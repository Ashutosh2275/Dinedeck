import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const CustomCursor = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isImageHovered, setIsImageHovered] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 150 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const moveCursor = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleHover = (e) => {
      const target = e.target;
      if (target.closest('button, a, .magnetic-button')) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }

      if (target.closest('img, .glow-card')) {
        setIsImageHovered(true);
      } else {
        setIsImageHovered(false);
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleHover);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleHover);
    };
  }, [cursorX, cursorY]);

  if (isMobile) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {/* Small Dot */}
      <motion.div
        className="w-2 h-2 bg-white rounded-full fixed top-0 left-0 mix-blend-difference"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />
      {/* Large Ring */}
      <motion.div
        className="border border-indigo-500 rounded-full fixed top-0 left-0"
        animate={{
          width: isHovered ? 60 : isImageHovered ? 80 : 40,
          height: isHovered ? 60 : isImageHovered ? 80 : 40,
          backgroundColor: isHovered ? 'rgba(79, 70, 229, 0.2)' : 'rgba(79, 70, 229, 0)',
          borderRadius: isImageHovered ? '12px' : '9999px',
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />
    </div>
  );
};

export default CustomCursor;
