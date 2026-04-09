'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Inbox } from 'lucide-react';

import { getRevealMotion } from '@/lib/motion';

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  compact = false,
  tone = 'neutral'
}) {
  const shouldReduceMotion = useReducedMotion();
  const revealMotion = getRevealMotion(shouldReduceMotion, {
    y: compact ? 8 : 12,
    scale: 0.99,
    duration: 0.28
  });

  return (
    <motion.div
      className={['empty-state', compact ? 'empty-state--compact' : '', `empty-state--${tone}`]
        .filter(Boolean)
        .join(' ')}
      {...revealMotion}
    >
      <span className="empty-state-icon" aria-hidden="true">
        <Icon size={compact ? 18 : 22} />
      </span>
      <div className="empty-state-copy">
        <strong>{title}</strong>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="empty-state-action">{action}</div> : null}
    </motion.div>
  );
}
