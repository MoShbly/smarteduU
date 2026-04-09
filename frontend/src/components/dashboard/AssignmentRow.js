'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default function AssignmentRow({
  title,
  description,
  meta = [],
  statusLabel,
  statusTone = 'neutral',
  dueLabel,
  actionLabel,
  selected = false,
  onSelect,
  onAction
}) {
  const handleAction = (event) => {
    event.stopPropagation();
    onAction?.();
  };

  return (
    <motion.div
      className={`assignment-row ${selected ? 'is-active' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      whileHover={{ y: -2 }}
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={
        onSelect
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
    >
      <div className="assignment-row-main">
        <div className="assignment-row-copy">
          <strong>{title}</strong>
          {description ? <p>{description}</p> : null}
        </div>

        {meta.length ? (
          <div className="assignment-row-meta">
            {meta.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="assignment-row-side">
        <Badge tone={statusTone}>{statusLabel}</Badge>
        {dueLabel ? <small>{dueLabel}</small> : null}
        {actionLabel ? (
          <Button variant="ghost" size="sm" onClick={handleAction} icon={ArrowRight} iconPosition="right">
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </motion.div>
  );
}
