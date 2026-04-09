'use client';

import { motion, useReducedMotion } from 'framer-motion';

import Card from '@/components/ui/Card';
import { getHoverLift, getRevealMotion } from '@/lib/motion';

export default function InsightCard({
  eyebrow,
  value,
  title,
  description,
  accent = 'primary',
  icon: Icon,
  featured = false
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      {...getRevealMotion(shouldReduceMotion, {
        y: 12,
        scale: 0.992,
        duration: 0.28
      })}
      whileHover={getHoverLift(shouldReduceMotion, featured ? -6 : -4)}
    >
      <Card
        className={[
          'insight-card',
          `insight-card--${accent}`,
          featured ? 'insight-card--featured' : ''
        ]
          .filter(Boolean)
          .join(' ')}
        tone="subtle"
      >
        <span className="insight-card-glow" aria-hidden="true" />

        <div className="insight-card-head">
          <div className="insight-card-kicker">
            {Icon ? (
              <span className="insight-card-icon" aria-hidden="true">
                <Icon size={16} />
              </span>
            ) : null}
            <span>{eyebrow}</span>
          </div>
          <strong className="insight-card-value">{value}</strong>
        </div>

        <div className="insight-card-body">
          <h3>{title}</h3>
          <p>{description}</p>
        </div>

        <span className="insight-card-meter" aria-hidden="true">
          <span />
        </span>
      </Card>
    </motion.div>
  );
}
