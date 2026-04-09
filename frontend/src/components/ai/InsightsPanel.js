'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, BarChart3, Sparkles, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';

import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';

const insightTypeMap = {
  warning: AlertTriangle,
  success: Trophy,
  neutral: Sparkles
};

const fallbackCardIcon = BarChart3;

export default function InsightsPanel({
  loading = false,
  title,
  description,
  insights = [],
  cards = []
}) {
  const t = useTranslations('insightsPanel');
  const hasAnySignals = insights.length > 0 || cards.length > 0;

  return (
    <Card className="ai-insights-panel" tone="soft">
      <div className="ai-panel-head">
        <div className="ai-panel-copy">
          <span className="ai-panel-eyebrow">{t('eyebrow')}</span>
          <h3>{title || t('title')}</h3>
          <p>{description || t('description')}</p>
        </div>
      </div>

      {loading ? (
        <>
          <div className="ai-insight-list">
            <Skeleton className="ai-skeleton-card" variant="panel" />
            <Skeleton className="ai-skeleton-card" variant="panel" />
          </div>
          <div className="ai-student-grid">
            <Skeleton className="ai-skeleton-card" variant="panel" />
            <Skeleton className="ai-skeleton-card" variant="panel" />
            <Skeleton className="ai-skeleton-card" variant="panel" />
          </div>
        </>
      ) : !hasAnySignals ? (
        <EmptyState compact title={t('emptyTitle')} description={t('emptyDescription')} />
      ) : (
        <>
          <div className="ai-insight-list">
            {insights.map((insight, index) => {
              const InsightIcon = insightTypeMap[insight.type] || insightTypeMap.neutral;
              const tone = insight.type || 'neutral';

              return (
                <motion.article
                  key={insight.id || `${insight.code}-${index}`}
                  className={`ai-insight-card ai-insight-card--${tone}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.04 }}
                >
                  <span className="ai-insight-icon" aria-hidden="true">
                    <InsightIcon size={16} />
                  </span>
                  <div className="ai-insight-copy">
                    <strong>{t(`insights.${insight.code}.title`, insight.values || {})}</strong>
                    <p>{t(`insights.${insight.code}.message`, insight.values || {})}</p>
                    {insight.actionKey ? (
                      <small>{t(`actions.${insight.actionKey}`, insight.values || {})}</small>
                    ) : null}
                  </div>
                </motion.article>
              );
            })}
          </div>

          {cards.length ? (
            <div className="ai-student-grid">
              {cards.map((card) => {
                const CardIcon = card.icon || fallbackCardIcon;

                return (
                  <div className={`ai-student-card ai-student-card--${card.tone || 'neutral'}`} key={card.id}>
                    <div className="ai-student-card-head">
                      <span className="ai-student-card-icon" aria-hidden="true">
                        <CardIcon size={16} />
                      </span>
                      <strong>{card.label}</strong>
                    </div>
                    <span className="ai-student-card-value">{card.value}</span>
                    {card.helper ? <p>{card.helper}</p> : null}
                    {card.caption ? <small>{card.caption}</small> : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState compact title={t('studentEmptyTitle')} description={t('studentEmptyDescription')} />
          )}
        </>
      )}
    </Card>
  );
}
