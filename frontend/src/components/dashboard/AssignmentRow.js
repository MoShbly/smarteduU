'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProgressMeter from '@/components/ui/ProgressMeter';
import { getHoverLift, getRevealMotion } from '@/lib/motion';

export default function AssignmentRow({
  title,
  description,
  meta = [],
  progress = null,
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
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`assignment-row ${selected ? 'is-active' : ''}`}
      {...getRevealMotion(shouldReduceMotion, {
        y: 10,
        scale: 0.994,
        duration: 0.26
      })}
      whileHover={getHoverLift(shouldReduceMotion, selected ? -6 : -4)}
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
      <span className="assignment-row-glow" aria-hidden="true" />

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

        {progress ? (
          <ProgressMeter
            value={progress.value}
            label={progress.label}
            helper={progress.helper}
            compact
            tone={progress.tone || 'accent'}
          />
        ) : null}
      </div>

      <div className="assignment-row-side">
        <div className="assignment-row-status">
          <Badge tone={statusTone}>{statusLabel}</Badge>
          {dueLabel ? <small>{dueLabel}</small> : null}
        </div>
        {actionLabel ? (
          <Button
            variant="ghost"
            size="sm"
            className="assignment-row-action"
            onClick={handleAction}
            icon={ArrowRight}
            iconPosition="right"
          >
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </motion.div>
  );
}
