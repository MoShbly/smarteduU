'use client';

import { motion } from 'framer-motion';
import { ArrowRight, BookOpenText, FileText, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { memo } from 'react';

import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';

const CourseCard = memo(function CourseCard({ course, subtitle, actionLabel, selected = false }) {
  const t = useTranslations('courseCard');
  const description = course.description?.trim() || t('defaultDescription');

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -2 }}
    >
      <Card className={`course-card ${selected ? 'course-card--selected' : ''}`} tone="soft">
        <div className="course-card-header">
          <div className="course-title-block">
            <div className="course-chip-row">
              <Badge tone="accent" className="course-badge">
                {course.code}
              </Badge>
              <span className="course-subject">{course.subject || t('generalStudies')}</span>
            </div>
            <h3>{course.title}</h3>
          </div>

          <span className="course-card-action" aria-hidden="true">
            {actionLabel}
            <ArrowRight size={16} />
          </span>
        </div>

        <p className="course-copy">{description}</p>
        {subtitle ? <p className="course-caption">{subtitle}</p> : null}

        <div className="course-meta-grid">
          <div className="course-meta-item">
            <Users size={16} />
            <span>{course._count?.enrollments ?? 0} {t('enrollments')}</span>
          </div>
          <div className="course-meta-item">
            <FileText size={16} />
            <span>{course._count?.assignments ?? 0} {t('assignments')}</span>
          </div>
          <div className="course-meta-item">
            <BookOpenText size={16} />
            <span>{course.teacher?.name || subtitle || t('workspace')}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

export default CourseCard;
