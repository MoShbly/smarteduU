'use client';

import { motion } from 'framer-motion';

const hoverByVariant = {
  ghost: { y: -1 },
  secondary: { y: -2 },
  primary: { y: -2 },
  danger: { y: -2 }
};

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
  const isDisabled = disabled || loading;

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
      whileHover={isDisabled ? undefined : hoverByVariant[variant] || hoverByVariant.primary}
      whileTap={isDisabled ? undefined : { scale: 0.985 }}
      {...props}
    >
      {loading ? <span className="button-spinner" aria-hidden="true" /> : null}
      {Icon && iconPosition === 'left' ? <Icon size={16} aria-hidden="true" /> : null}
      <span>{children}</span>
      {Icon && iconPosition === 'right' ? <Icon size={16} aria-hidden="true" /> : null}
    </motion.button>
  );
}
