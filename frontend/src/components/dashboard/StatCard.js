'use client';

import { motion, useReducedMotion } from 'framer-motion';

import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { getHoverLift, getRevealMotion } from '@/lib/motion';

export default function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  accent = 'primary',
  featured = false,
  emptyTitle = '',
  emptyDescription = ''
}) {
  const shouldReduceMotion = useReducedMotion();
  const isEmpty = value === null || value === undefined;

  return (
    <motion.div
      {...getRevealMotion(shouldReduceMotion, {
        y: 14,
        scale: 0.99,
        duration: 0.3
      })}
      whileHover={getHoverLift(shouldReduceMotion, featured ? -7 : -5)}
    >
      <Card
        className={[
          'stat-card',
          `stat-card--${accent}`,
          featured ? 'stat-card--featured' : ''
        ]
          .filter(Boolean)
          .join(' ')}
        tone="soft"
      >
        {isEmpty ? (
          <EmptyState compact title={emptyTitle || label} description={emptyDescription || helper} />
        ) : (
          <>
            <span className="stat-card-glow" aria-hidden="true" />

            <div className="stat-card-head">
              <div className="stat-card-copy">
                <span className="stat-card-label">{label}</span>
                <strong className="stat-card-value">{value}</strong>
              </div>
              {Icon ? (
                <span className="stat-card-icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
              ) : null}
            </div>

            <div className="stat-card-foot">
              {helper ? <p className="stat-card-helper">{helper}</p> : null}
              <span className="stat-card-trace" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </div>
          </>
        )}
      </Card>
    </motion.div>
  );
}
