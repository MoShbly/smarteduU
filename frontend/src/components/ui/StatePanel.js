'use client';

import { AlertTriangle, CircleCheckBig, Inbox, LoaderCircle } from 'lucide-react';

import EmptyState from './EmptyState';

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

  return <EmptyState icon={Icon} title={title} description={description} action={action} compact={compact} tone={variant} />;
}

