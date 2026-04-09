'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import { MOTION_EASE_SOFT } from '@/lib/motion';

export default function Input({
  id,
  label,
  error,
  hint,
  icon: Icon,
  trailingControl,
  multiline = false,
  rows = 4,
  className = '',
  controlClassName = '',
  labelAction,
  ...props
}) {
  const shouldReduceMotion = useReducedMotion();
  const Control = multiline ? 'textarea' : 'input';
  const feedbackMotion = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
      }
    : {
        initial: { opacity: 0, y: -4 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -4 }
      };

  return (
    <motion.label
      layout
      className={[
        'field',
        error ? 'has-error' : '',
        props.disabled ? 'is-disabled' : '',
        trailingControl ? 'has-trailing' : '',
        className
      ]
        .filter(Boolean)
        .join(' ')}
      htmlFor={id}
      transition={{ duration: 0.22, ease: MOTION_EASE_SOFT }}
    >
      {label ? (
        <span className="field-label-row">
          <span className="field-label">{label}</span>
          {labelAction ? <span className="field-label-action">{labelAction}</span> : null}
        </span>
      ) : null}

      <span
        className={['field-control', Icon ? 'has-icon' : '', controlClassName].filter(Boolean).join(' ')}
      >
        {Icon ? (
          <span className="field-icon" aria-hidden="true">
            <Icon size={16} />
          </span>
        ) : null}
        <Control
          id={id}
          rows={multiline ? rows : undefined}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {trailingControl ? <span className="field-trailing">{trailingControl}</span> : null}
      </span>

      <AnimatePresence mode="wait" initial={false}>
        {error ? (
          <motion.span
            key="error"
            className="field-feedback field-feedback--error"
            {...feedbackMotion}
            transition={{ duration: 0.18, ease: MOTION_EASE_SOFT }}
          >
            {error}
          </motion.span>
        ) : hint ? (
          <motion.span
            key="hint"
            className="field-hint"
            {...feedbackMotion}
            transition={{ duration: 0.18, ease: MOTION_EASE_SOFT }}
          >
            {hint}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </motion.label>
  );
}
