'use client';

import { motion, useReducedMotion } from 'framer-motion';

import { MOTION_EASE_SOFT } from '@/lib/motion';

const clampPercent = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null;
  }

  return Math.min(100, Math.max(0, Math.round(Number(value))));
};

export default function ProgressMeter({
  value,
  label,
  helper,
  compact = false,
  tone = 'accent'
}) {
  const shouldReduceMotion = useReducedMotion();
  const normalizedValue = clampPercent(value);

  return (
    <div
      className={[
        'progress-meter',
        compact ? 'progress-meter--compact' : '',
        `progress-meter--${tone}`,
        normalizedValue === null ? 'is-empty' : ''
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="progress-meter-head">
        <span className="progress-meter-label">{label}</span>
        <strong className="progress-meter-value">
          {normalizedValue === null ? '--' : `${normalizedValue}%`}
        </strong>
      </div>

      <div className="progress-meter-track" aria-hidden="true">
        <motion.span
          className="progress-meter-fill"
          initial={{ width: 0 }}
          animate={{ width: normalizedValue === null ? '0%' : `${normalizedValue}%` }}
          transition={{
            duration: shouldReduceMotion ? 0.01 : 0.32,
            ease: MOTION_EASE_SOFT
          }}
        />
      </div>

      {helper ? <small className="progress-meter-helper">{helper}</small> : null}
    </div>
  );
}
