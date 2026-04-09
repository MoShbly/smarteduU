'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  BookOpenCheck,
  ClipboardCheck,
  LogIn,
  PencilLine,
  ScanSearch,
  Sparkles,
  UserPlus
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { formatActivityLabel, formatDate } from '@/lib/dashboard';
import { getRevealMotion } from '@/lib/motion';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';

const getActivityTarget = (activity) =>
  activity.details?.title ||
  activity.details?.assignmentTitle ||
  activity.details?.courseTitle ||
  activity.details?.studentName ||
  activity.entityType;

const iconMap = {
  'course.created': BookOpenCheck,
  'course.joined': UserPlus,
  'assignment.created': BookOpenCheck,
  'assignment.started': PencilLine,
  'assignment.viewed': BookOpenCheck,
  'submission.created': ClipboardCheck,
  'submission.draft_saved': PencilLine,
  'submission.resubmitted': ClipboardCheck,
  'submission.reviewed': ScanSearch,
  'submission.updated': ClipboardCheck,
  'submission.graded': ScanSearch,
  'user.logged_in': LogIn,
  'user.registered': Sparkles
};

export default function ActivityFeed({ activities = [] }) {
  const t = useTranslations('activityFeed');
  const locale = useLocale();
  const shouldReduceMotion = useReducedMotion();

  if (!activities.length) {
    return (
      <EmptyState
        compact
        title={t('emptyTitle')}
        description={t('emptyDescription')}
        icon={Activity}
      />
    );
  }

  return (
    <div className="activity-timeline">
      {activities.map((activity, index) => {
        const ItemIcon = iconMap[activity.action] || Activity;
        const formattedDate = formatDate(activity.createdAt, locale);
        const isLatest = index === 0;

        return (
          <motion.div
            className={`activity-item ${isLatest ? 'activity-item--latest' : ''}`}
            key={activity.id}
            {...getRevealMotion(shouldReduceMotion, {
              y: 10,
              scale: 0.995,
              duration: 0.24,
              delay: shouldReduceMotion ? 0 : index * 0.03
            })}
          >
            <div className="activity-rail" aria-hidden="true">
              <span className="activity-item-icon">
                <ItemIcon size={16} />
              </span>
              {index < activities.length - 1 ? <span className="activity-rail-line" /> : null}
            </div>
            <Card className={`activity-card ${isLatest ? 'activity-card--latest' : ''}`} tone="subtle">
              <div className="activity-item-copy">
                <div className="activity-item-meta">
                  <strong>{getActivityTarget(activity) || t('unknownTarget')}</strong>
                  <Badge tone={isLatest ? 'accent' : 'neutral'}>{formatActivityLabel(activity.action, t)}</Badge>
                </div>

                <div className="activity-item-detail-row">
                  <p>{activity.actor?.name || t('actorFallback')}</p>
                  <small className="activity-timestamp">{formattedDate}</small>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
