import { motion, useReducedMotion } from 'framer-motion';

import { MOTION_EASE_SOFT } from '@/lib/motion';

export default function Skeleton({
  className = '',
  style = {},
  height,
  width,
  count = 1,
  variant = 'text'
}) {
  const shouldReduceMotion = useReducedMotion();
  const baseClass = `skeleton skeleton--${variant} ${className}`;
  const getStyle = () => ({
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    ...style
  });

  const Skeletons = Array.from({ length: count }).map((_, i) => (
    <motion.div
      key={i}
      className={baseClass}
      style={getStyle()}
      initial={{ opacity: 0.45 }}
      animate={{ opacity: shouldReduceMotion ? 0.8 : 1 }}
      transition={{
        duration: shouldReduceMotion ? 0.2 : 1.1,
        repeat: shouldReduceMotion ? 0 : Infinity,
        repeatType: shouldReduceMotion ? undefined : 'reverse',
        ease: shouldReduceMotion ? MOTION_EASE_SOFT : 'easeInOut'
      }}
    />
  ));

  return <>{Skeletons}</>;
}
