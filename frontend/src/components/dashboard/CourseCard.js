'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, BookOpenText, FileText, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { memo } from 'react';

import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import ProgressMeter from '@/components/ui/ProgressMeter';
import { getHoverLift, getRevealMotion } from '@/lib/motion';

const CourseCard = memo(function CourseCard({ course, subtitle, actionLabel, selected = false }) {
  const t = useTranslations('courseCard');
  const shouldReduceMotion = useReducedMotion();
  const description = course.description?.trim() || t('defaultDescription');
  const enrollmentCount = course._count?.enrollments ?? 0;
  const assignmentCount = course._count?.assignments ?? 0;
  const ownerLabel = course.teacher?.name || course.code;
  const courseProgress = course.courseProgress || null;
  const hasCourseProgress = Boolean(courseProgress?.totalAssignments);
  const courseProgressHelper =
    courseProgress?.studentsCount !== undefined
      ? t('progressTeacherHelper', {
          rate: courseProgress.completionRate ?? 0,
          students: courseProgress.studentsCount
        })
      : t('progressHelper', {
          completed: courseProgress?.completedAssignments ?? 0,
          total: courseProgress?.totalAssignments ?? 0
        });

  return (
    <motion.div
      {...getRevealMotion(shouldReduceMotion, {
        y: 16,
        scale: 0.992,
        duration: 0.34
      })}
      whileHover={getHoverLift(shouldReduceMotion, selected ? -7 : -5)}
    >
      <Card className={`course-card ${selected ? 'course-card--selected' : ''}`} tone="soft">
        <span className="course-card-glow" aria-hidden="true" />

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
            <span className="course-card-action-label">{actionLabel}</span>
            <ArrowRight size={16} />
          </span>
        </div>

        <p className="course-copy">{description}</p>
        {subtitle ? <p className="course-caption">{subtitle}</p> : null}

        {hasCourseProgress ? (
          <ProgressMeter
            value={courseProgress.progressPercent}
            label={t('progressLabel')}
            helper={courseProgressHelper}
            compact
          />
        ) : (
          <p className="course-caption">{t('progressEmpty')}</p>
        )}

        <div className="course-meta-grid">
          <div className="course-meta-item">
            <span className="course-meta-icon" aria-hidden="true">
              <Users size={16} />
            </span>
            <div className="course-meta-copy">
              <strong>{enrollmentCount}</strong>
              <small>{t('enrollments')}</small>
            </div>
          </div>
          <div className="course-meta-item">
            <span className="course-meta-icon" aria-hidden="true">
              <FileText size={16} />
            </span>
            <div className="course-meta-copy">
              <strong>{assignmentCount}</strong>
              <small>{t('assignments')}</small>
            </div>
          </div>
          <div className="course-meta-item">
            <span className="course-meta-icon" aria-hidden="true">
              <BookOpenText size={16} />
            </span>
            <div className="course-meta-copy">
              <strong>{ownerLabel}</strong>
              <small>{subtitle || t('workspace')}</small>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

export default CourseCard;
