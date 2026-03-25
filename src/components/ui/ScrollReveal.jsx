import { motion } from 'framer-motion'

export default function ScrollReveal({ children, delay = 0, direction = 'up', className = '' }) {
  const directionMap = {
    up: { y: 40, x: 0 },
    left: { y: 0, x: 40 },
    right: { y: 0, x: -40 },
  }
  const { x, y } = directionMap[direction] || directionMap.up

  return (
    <motion.div
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
