'use client';

import { motion, useReducedMotion } from 'framer-motion';

import { getRevealMotion } from '@/lib/motion';

export default function AnimatedPage({ children, className = '' }) {
  const shouldReduceMotion = useReducedMotion();
  const revealMotion = getRevealMotion(shouldReduceMotion, {
    y: 18,
    scale: 0.992,
    duration: 0.44
  });

  return (
    <motion.div
      className={className}
      {...revealMotion}
    >
      {children}
    </motion.div>
  );
}

