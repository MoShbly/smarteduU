'use client';

import { motion, useReducedMotion } from 'framer-motion';

import { getHoverLift, getPressMotion, MOTION_EASE_SOFT } from '@/lib/motion';

export default function Button({
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...props
}) {
  const shouldReduceMotion = useReducedMotion();
  const isDisabled = disabled || loading;
  const hoverLift =
    variant === 'ghost' ? getHoverLift(shouldReduceMotion, -2) : getHoverLift(shouldReduceMotion, -3);
  const pressMotion = getPressMotion(shouldReduceMotion);

  return (
    <motion.button
      type={type}
      className={[
        'ui-button',
        `ui-button--${variant}`,
        `ui-button--${size}`,
        fullWidth ? 'ui-button--block' : '',
        className
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={isDisabled}
      aria-busy={loading}
      whileHover={isDisabled ? undefined : hoverLift}
      whileTap={isDisabled ? undefined : pressMotion}
      transition={{ duration: 0.22, ease: MOTION_EASE_SOFT }}
      {...props}
    >
      {loading ? <span className="button-spinner" aria-hidden="true" /> : null}
      {Icon && iconPosition === 'left' ? (
        <span className="ui-button-icon" aria-hidden="true">
          <Icon size={16} />
        </span>
      ) : null}
      <span className="ui-button-label">{children}</span>
      {Icon && iconPosition === 'right' ? (
        <span className="ui-button-icon" aria-hidden="true">
          <Icon size={16} />
        </span>
      ) : null}
    </motion.button>
  );
}
