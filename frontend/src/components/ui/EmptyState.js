'use client';

import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  compact = false,
  tone = 'neutral'
}) {
  return (
    <motion.div
      className={['empty-state', compact ? 'empty-state--compact' : '', `empty-state--${tone}`]
        .filter(Boolean)
        .join(' ')}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
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
