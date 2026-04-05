'use client';

import { AlertTriangle, CircleCheckBig, Inbox, LoaderCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const iconMap = {
  empty: Inbox,
  error: AlertTriangle,
  success: CircleCheckBig,
  loading: LoaderCircle
};

export default function StatePanel({
  variant = 'empty',
  title,
  description,
  action,
  compact = false
}) {
  const Icon = iconMap[variant] || Inbox;

  return (
    <motion.div
      className={`state-panel ${compact ? 'compact' : ''} ${variant}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <span className={`state-icon ${variant}`}>
        <Icon size={compact ? 18 : 22} className={variant === 'loading' ? 'spin' : ''} />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {action || null}
    </motion.div>
  );
}

