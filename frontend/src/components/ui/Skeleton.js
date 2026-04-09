import { motion } from 'framer-motion';

export default function Skeleton({
  className = '',
  style = {},
  height,
  width,
  count = 1,
  variant = 'text'
}) {
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
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 1.1,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut'
      }}
    />
  ));

  return <>{Skeletons}</>;
}
