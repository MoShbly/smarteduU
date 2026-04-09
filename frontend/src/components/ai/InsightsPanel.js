'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, ShieldAlert, Sparkles, Trophy } from 'lucide-react';

import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';

const insightTypeMap = {
  warning: {
    icon: AlertTriangle,
    label: 'Attention needed'
  },
  success: {
    icon: Trophy,
    label: 'Positive signal'
  },
  neutral: {
    icon: Sparkles,
    label: 'Class insight'
  }
};

const glanceCards = (weakStudents, topStudents, riskStudents) => [
  {
    id: 'risk',
    label: 'At risk',
    value: riskStudents.length,
    hint: 'Missing recent work',
    names: riskStudents.map((student) => student.name),
    icon: ShieldAlert,
    tone: 'warning'
  },
  {
    id: 'support',
    label: 'Need support',
    value: weakStudents.length,
    hint: 'Low scores or missed work',
    names: weakStudents.map((student) => student.name),
    icon: AlertTriangle,
    tone: 'warning'
  },
  {
    id: 'top',
    label: 'Top performers',
    value: topStudents.length,
    hint: 'Strong recent grades',
    names: topStudents.map((student) => student.name),
    icon: Trophy,
    tone: 'success'
  }
];

const formatPreviewNames = (names = []) => {
  if (!names.length) {
    return 'No students right now';
  }

  if (names.length <= 2) {
    return names.join(', ');
  }

  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
};

export default function InsightsPanel({
  loading = false,
  insights = [],
  weakStudents = [],
  topStudents = [],
  riskStudents = []
}) {
  const studentCards = glanceCards(weakStudents, topStudents, riskStudents);

  return (
    <Card className="ai-insights-panel" tone="soft">
      <div className="ai-panel-head">
        <div className="ai-panel-copy">
          <span className="ai-panel-eyebrow">AI-style student analytics</span>
          <h3>Student intelligence</h3>
          <p>Fast signals from grades and recent submissions.</p>
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
      ) : (
        <>
          <div className="ai-insight-list">
            {insights.map((insight, index) => {
              const typeMeta = insightTypeMap[insight.type] || insightTypeMap.neutral;
              const InsightIcon = typeMeta.icon;

              return (
                <motion.article
                  key={insight.id || `${insight.message}-${index}`}
                  className={`ai-insight-card ai-insight-card--${insight.type || 'neutral'}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.04 }}
                >
                  <span className="ai-insight-icon" aria-hidden="true">
                    <InsightIcon size={16} />
                  </span>
                  <div className="ai-insight-copy">
                    <strong>{typeMeta.label}</strong>
                    <p>{insight.message}</p>
                    {insight.actionHint ? <small>{insight.actionHint}</small> : null}
                  </div>
                </motion.article>
              );
            })}
          </div>

          <div className="ai-student-grid">
            {studentCards.map((card) => {
              const CardIcon = card.icon;

              return (
                <div className={`ai-student-card ai-student-card--${card.tone}`} key={card.id}>
                  <div className="ai-student-card-head">
                    <span className="ai-student-card-icon" aria-hidden="true">
                      <CardIcon size={16} />
                    </span>
                    <strong>{card.label}</strong>
                  </div>
                  <span className="ai-student-card-value">{card.value}</span>
                  <p>{card.hint}</p>
                  <small>{formatPreviewNames(card.names)}</small>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}
