'use client';

import { Activity, BookOpenCheck, ClipboardCheck, UserPlus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { formatDate, formatStatusLabel } from '@/lib/dashboard';
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
  'course.joined': UserPlus,
  'assignment.created': BookOpenCheck,
  'submission.created': ClipboardCheck
};

export default function ActivityFeed({ activities = [] }) {
  const t = useTranslations('activityFeed');
  const locale = useLocale();

  if (!activities.length) {
    return <EmptyState compact title={t('empty')} description="" icon={Activity} />;
  }

  return (
    <div className="activity-timeline">
      {activities.map((activity, index) => {
        const ItemIcon = iconMap[activity.action] || Activity;

        return (
          <div className="activity-item" key={activity.id}>
            <div className="activity-rail" aria-hidden="true">
              <span className="activity-item-icon">
                <ItemIcon size={16} />
              </span>
              {index < activities.length - 1 ? <span className="activity-rail-line" /> : null}
            </div>
            <Card className="activity-card" tone="subtle">
              <div className="activity-item-copy">
                <div className="activity-item-meta">
                  <strong>{getActivityTarget(activity)}</strong>
                  <Badge tone="neutral">{formatStatusLabel(activity.action)}</Badge>
                </div>
                <p>{activity.actor?.name || t('actorFallback')}</p>
                <small>{formatDate(activity.createdAt, locale)}</small>
              </div>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
