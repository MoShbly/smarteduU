'use client';

import { motion } from 'framer-motion';
import {
  BarChart3,
  CalendarClock,
  Clock3,
  FileCheck2,
  GraduationCap,
  LineChart,
  Plus,
  Sparkles,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import InsightsPanel from '@/components/ai/InsightsPanel';
import ActivityFeed from '@/components/classroom/ActivityFeed';
import CourseJoinForm from '@/components/classroom/CourseJoinForm';
import SubmissionComposer from '@/components/classroom/SubmissionComposer';
import PerformanceChart from '@/components/charts/PerformanceChart';
import SubmissionChart from '@/components/charts/SubmissionChart';
import AssignmentRow from '@/components/dashboard/AssignmentRow';
import CourseCard from '@/components/dashboard/CourseCard';
import InsightCard from '@/components/dashboard/InsightCard';
import StatCard from '@/components/dashboard/StatCard';
import ProtectedRoute from '@/components/guards/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';
import AnimatedPage from '@/components/motion/AnimatedPage';
import { PROTECTED_ROUTE_ROLES } from '@/constants/routes';
import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import {
  formatDate,
  formatDueState,
  formatProgressState,
  formatStatusLabel,
  formatTrendLabel,
  getProgressTone,
  getSubmissionTone
} from '@/lib/dashboard';
import { activityService } from '@/services/activity.service';
import { assignmentService } from '@/services/assignment.service';
import { courseService } from '@/services/course.service';
import { dashboardService } from '@/services/dashboard.service';
import { submissionService } from '@/services/submission.service';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';
import StatePanel from '@/components/ui/StatePanel';

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      delay: 0.04 + index * 0.05
    }
  })
};

function DashboardLoadingState() {
  return (
    <div className="dashboard-stack">
      <section className="dashboard-stats-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="metric-skeleton-card" variant="panel" />
        ))}
      </section>

      <section className="dashboard-grid dashboard-grid--insights">
        <Skeleton className="hero-panel-skeleton" variant="panel" />
      </section>

      <section className="dashboard-grid dashboard-grid--charts">
        <Skeleton className="chart-skeleton" variant="panel" />
        <Skeleton className="chart-skeleton" variant="panel" />
      </section>
    </div>
  );
}

function StudentDashboardContent() {
  const t = useTranslations('studentDashboard');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const tWorkspace = useTranslations('studentWorkspace');
  const locale = useLocale();
  const { token } = useAuth();
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [activeModal, setActiveModal] = useState('');
  const trackedViewsRef = useRef(new Set());

  const dashboardSections = [
    { href: '#overview', label: tNav('overview') },
    { href: '#insights', label: tNav('insights') },
    { href: '#courses', label: tNav('courses') },
    { href: '#assignments', label: tNav('assignments') },
    { href: '#completed', label: tNav('completed') },
    { href: '#activity', label: tNav('activity') }
  ];

  const {
    data: dashboard,
    loading: dashboardLoading,
    error: dashboardError,
    reload: reloadDashboard
  } = useApiQuery(() => dashboardService.getStudentOverview(token), [token], {
    enabled: Boolean(token),
    initialData: null
  });

  const {
    data: analyticsData,
    loading: analyticsLoading,
    error: analyticsError,
    reload: reloadAnalytics
  } = useApiQuery(() => dashboardService.getAnalytics(token), [token], {
    enabled: Boolean(token),
    initialData: null
  });

  const {
    data: courses,
    loading: coursesLoading,
    error: coursesError,
    reload: reloadCourses
  } = useApiQuery(() => courseService.getCourses(token), [token], {
    enabled: Boolean(token),
    initialData: []
  });

  const {
    data: assignments,
    loading: assignmentsLoading,
    error: assignmentsError,
    reload: reloadAssignments
  } = useApiQuery(
    () => assignmentService.getAssignmentsByCourse(selectedCourseId, token),
    [token, selectedCourseId],
    {
      enabled: Boolean(token && selectedCourseId),
      initialData: []
    }
  );

  const {
    data: activities,
    loading: activitiesLoading,
    error: activitiesError,
    reload: reloadActivities
  } = useApiQuery(() => activityService.getActivity(token, 15), [token], {
    enabled: Boolean(token),
    initialData: []
  });

  useEffect(() => {
    if (!courses.length) {
      setSelectedCourseId('');
      return;
    }

    if (!selectedCourseId || !courses.some((course) => course.id === selectedCourseId)) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  useEffect(() => {
    if (!assignments.length) {
      setSelectedAssignmentId('');
      return;
    }

    if (!selectedAssignmentId || !assignments.some((assignment) => assignment.id === selectedAssignmentId)) {
      setSelectedAssignmentId(assignments[0].id);
    }
  }, [assignments, selectedAssignmentId]);

  const selectedCourse = courses.find((course) => course.id === selectedCourseId) || null;
  const selectedAssignment = assignments.find((assignment) => assignment.id === selectedAssignmentId) || null;
  const selectedSubmission = selectedAssignment?.submissions?.[0] || null;
  const metrics = dashboard?.metrics || {
    enrolledCourses: 0,
    pendingAssignments: 0,
    completedAssignments: 0
  };
  const analyticsSummary = analyticsData?.summary || null;
  const averageScore = analyticsSummary?.averageScore ?? null;
  const nextAssignment =
    assignments.find((assignment) => assignment.progress?.progressPercent < 100) ||
    dashboard?.upcomingAssignments?.[0] ||
    null;
  const hasPerformanceData = Boolean(analyticsData?.performance?.length);
  const hasSubmissionData = Boolean(analyticsData?.submissions?.length);
  const latestSubmission = dashboard?.recentSubmissions?.[0] || null;
  const weakestCourse = analyticsSummary?.weakestCourse || null;
  const trend = analyticsSummary?.trend || null;
  const consistencyRate = analyticsSummary?.consistencyRate ?? null;
  const pendingThisWeek = analyticsSummary?.pendingThisWeek ?? 0;
  const overviewHighlights = [
    nextAssignment
      ? {
          label: t('focusNextDeadline'),
          value: formatDate(nextAssignment.dueDate, locale),
          detail: nextAssignment.title
        }
      : null,
    selectedCourse
      ? {
          label: tWorkspace('focusSelectedCourse'),
          value: selectedCourse.code,
          detail: selectedCourse.title
        }
      : null,
    latestSubmission
      ? {
          label: tNav('completed'),
          value: formatDate(latestSubmission.submittedAt, locale),
          detail: latestSubmission.assignment?.title || t('assignmentUnavailable')
        }
      : null
  ].filter(Boolean);

  const analyticsCards = useMemo(() => {
    const cards = [];

    if (consistencyRate !== null) {
      cards.push({
        id: 'consistency',
        label: t('consistencyLabel'),
        value: `${consistencyRate}%`,
        helper: t('consistencyHelper'),
        caption: t('consistencyCaption'),
        tone: consistencyRate >= 80 ? 'success' : consistencyRate >= 60 ? 'accent' : 'warning',
        icon: BarChart3
      });
    }

    if (trend?.direction) {
      cards.push({
        id: 'trend',
        label: t('trendLabel'),
        value: formatTrendLabel(trend.direction, tCommon),
        helper: t('trendHelper'),
        caption:
          trend.delta !== null ? t('trendCaption', { delta: Math.abs(trend.delta) }) : t('trendNoData'),
        tone:
          trend.direction === 'improving'
            ? 'success'
            : trend.direction === 'declining'
              ? 'warning'
              : 'neutral',
        icon:
          trend.direction === 'declining'
            ? TrendingDown
            : trend.direction === 'improving'
              ? TrendingUp
              : Sparkles
      });
    }

    if (weakestCourse?.progressPercent !== null && weakestCourse?.progressPercent !== undefined) {
      cards.push({
        id: 'course-focus',
        label: t('focusCourseLabel'),
        value: `${weakestCourse.progressPercent}%`,
        helper: weakestCourse.title,
        caption: t('focusCourseCaption'),
        tone: weakestCourse.progressPercent >= 70 ? 'accent' : 'warning',
        icon: GraduationCap
      });
    }

    if (pendingThisWeek > 0) {
      cards.push({
        id: 'pending-week',
        label: t('pendingThisWeekLabel'),
        value: pendingThisWeek,
        helper: t('pendingThisWeekHelper'),
        caption: t('pendingThisWeekCaption'),
        tone: 'warning',
        icon: CalendarClock
      });
    }

    return cards;
  }, [consistencyRate, pendingThisWeek, t, tCommon, trend, weakestCourse]);

  const reloadWorkspace = () => {
    reloadDashboard();
    reloadCourses();
    reloadAssignments();
    reloadActivities();
    reloadAnalytics();
  };

  const refreshStudentData = () => {
    reloadDashboard();
    reloadAssignments();
    reloadActivities();
    reloadAnalytics();
  };

  const syncAssignmentProgress = async (assignmentId, { view = false, start = false } = {}) => {
    const requests = [];

    if (view && !trackedViewsRef.current.has(assignmentId)) {
      trackedViewsRef.current.add(assignmentId);
      requests.push(assignmentService.trackView(assignmentId, token));
    }

    if (start) {
      requests.push(assignmentService.trackStart(assignmentId, token));
    }

    if (!requests.length) {
      return;
    }

    try {
      await Promise.all(requests);
      refreshStudentData();
    } catch (_error) {
      // Tracking should not block the core workflow.
    }
  };

  const handleJoinCourse = async (payload) => {
    const course = await courseService.joinCourse(payload, token);
    reloadDashboard();
    reloadCourses();
    reloadActivities();
    setSelectedCourseId(course.id);
    return course;
  };

  const handleSaveDraft = async (payload) => {
    const submission = await submissionService.saveDraft(payload, token);
    refreshStudentData();
    return submission;
  };

  const handleSubmitAssignment = async (payload) => {
    const submission = await submissionService.createSubmission(payload, token);
    refreshStudentData();
    return submission;
  };

  const handleSelectAssignment = async (assignmentId) => {
    setSelectedAssignmentId(assignmentId);
    await syncAssignmentProgress(assignmentId, { view: true });
  };

  const handleOpenSubmission = async (assignment) => {
    setSelectedAssignmentId(assignment.id);
    await syncAssignmentProgress(assignment.id, {
      view: true,
      start: true
    });
    setActiveModal('submit');
  };

  if (dashboardLoading && !dashboard) {
    return (
      <AppShell title={t('title')} description={t('description')} sections={dashboardSections}>
        <AnimatedPage className="dashboard-page">
          <DashboardLoadingState />
        </AnimatedPage>
      </AppShell>
    );
  }

  if (dashboardError && !dashboard) {
    return (
      <AppShell title={t('title')} description={t('description')} sections={dashboardSections}>
        <AnimatedPage className="dashboard-page">
          <StatePanel
            variant="error"
            title={t('loadErrorTitle')}
            description={dashboardError || tCommon('loadingFallback')}
            action={
              <Button variant="secondary" onClick={reloadWorkspace}>
                {tCommon('retry')}
              </Button>
            }
          />
        </AnimatedPage>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={t('title')}
      description={t('description')}
      sections={dashboardSections}
      actions={
        <Button icon={Plus} onClick={() => setActiveModal('join')}>
          {tWorkspace('joinCourse')}
        </Button>
      }
    >
      <AnimatedPage className="dashboard-page dashboard-page--student">
        {dashboardError ? (
          <StatePanel
            variant="error"
            compact
            title={t('partialErrorTitle')}
            description={dashboardError || tCommon('loadingFallback')}
            action={
              <Button variant="secondary" onClick={reloadWorkspace}>
                {tCommon('retry')}
              </Button>
            }
          />
        ) : null}

        <motion.section
          id="overview"
          className="dashboard-section dashboard-section--hero"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <Card className="dashboard-hero-banner dashboard-hero-banner--student" tone="soft">
            <div className="dashboard-hero-copy">
              <Badge tone="accent">{t('heroEyebrow')}</Badge>
              <h2>{t('heroTitle')}</h2>
              <p>{t('heroDescription')}</p>
            </div>

            <div className="dashboard-hero-highlights">
              {overviewHighlights.length ? (
                overviewHighlights.map((item) => (
                  <article className="dashboard-hero-highlight" key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <small>{item.detail}</small>
                  </article>
                ))
              ) : (
                <EmptyState compact title={t('overviewEmptyTitle')} description={t('overviewEmptyDesc')} />
              )}
            </div>
          </Card>

          <div className="dashboard-stats-grid dashboard-stats-grid--highlighted">
            <StatCard
              label={t('metricPending')}
              value={metrics.pendingAssignments}
              helper={t('metricPendingHelper')}
              icon={Clock3}
              accent="gold"
              featured
            />
            <StatCard
              label={t('metricAverage')}
              value={averageScore}
              helper={t('metricAverageHelper')}
              icon={LineChart}
              accent="primary"
              emptyTitle={t('metricAverageEmptyTitle')}
              emptyDescription={t('metricAverageEmptyDesc')}
            />
            <StatCard
              label={t('metricEnrolled')}
              value={metrics.enrolledCourses}
              helper={t('metricEnrolledHelper')}
              icon={GraduationCap}
              accent="teal"
            />
            <StatCard
              label={t('metricSubmitted')}
              value={metrics.completedAssignments}
              helper={t('metricSubmittedHelper')}
              icon={FileCheck2}
              accent="rose"
            />
          </div>
        </motion.section>

        <motion.section
          id="insights"
          className="dashboard-section dashboard-section--insights"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          <Card className="insight-spotlight insight-spotlight--student" tone="soft">
            <div className="insight-spotlight-head">
              <div className="section-intro">
                <Badge tone="accent">{tNav('insights')}</Badge>
                <h2>{t('focusNextDeadline')}</h2>
                <p>
                  {nextAssignment
                    ? `${t('duePrefix')} ${formatDate(nextAssignment.dueDate, locale)}`
                    : t('focusNextDeadlineNoneDesc')}
                </p>
              </div>

              {selectedCourse ? (
                <div className="insight-spotlight-summary">
                  <span>{selectedCourse.code}</span>
                  <small>{selectedCourse.title}</small>
                </div>
              ) : (
                <EmptyState compact title={tWorkspace('noCourseSelected')} description={tWorkspace('selectCourseHint')} />
              )}
            </div>

            <div className="insight-spotlight-grid insight-spotlight-grid--featured">
              {nextAssignment ? (
                <InsightCard
                  eyebrow={t('focusNextDeadline')}
                  value={formatDate(nextAssignment.dueDate, locale)}
                  title={nextAssignment.title}
                  description={nextAssignment.course?.title || t('courseUnavailable')}
                  accent="gold"
                  icon={CalendarClock}
                  featured
                />
              ) : null}
              {averageScore !== null ? (
                <InsightCard
                  eyebrow={t('focusAverageScore')}
                  value={averageScore}
                  title={t('metricAverage')}
                  description={t('focusAverageScoreDesc')}
                  accent="primary"
                  icon={LineChart}
                />
              ) : null}
              {selectedCourse ? (
                <InsightCard
                  eyebrow={tWorkspace('focusSelectedCourse')}
                  value={selectedCourse.code}
                  title={selectedCourse.title}
                  description={`${t('teacherPrefix')}: ${selectedCourse.teacher?.name || t('unknownTeacher')}`}
                  accent="teal"
                  icon={GraduationCap}
                />
              ) : null}
              {latestSubmission ? (
                <InsightCard
                  eyebrow={tNav('completed')}
                  value={formatDate(latestSubmission.submittedAt, locale)}
                  title={latestSubmission.assignment?.title || t('assignmentUnavailable')}
                  description={formatStatusLabel(latestSubmission.status, tCommon)}
                  accent="rose"
                  icon={Sparkles}
                />
              ) : null}
              {!nextAssignment && averageScore === null && !selectedCourse && !latestSubmission ? (
                <EmptyState compact title={t('overviewEmptyTitle')} description={t('overviewEmptyDesc')} />
              ) : null}
            </div>
          </Card>

          {analyticsError ? (
            <StatePanel
              compact
              variant="error"
              title={t('analyticsErrorTitle')}
              description={analyticsError}
              action={
                <Button variant="secondary" onClick={reloadAnalytics}>
                  {tCommon('retry')}
                </Button>
              }
            />
          ) : (
            <InsightsPanel
              loading={analyticsLoading}
              title={t('analyticsPanelTitle')}
              description={t('analyticsPanelDesc')}
              insights={analyticsData?.insights || []}
              cards={analyticsCards}
            />
          )}
        </motion.section>

        {analyticsError ? (
          <motion.section
            className="dashboard-section"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <StatePanel
              compact
              variant="error"
              title={t('analyticsErrorTitle')}
              description={analyticsError}
              action={
                <Button variant="secondary" onClick={reloadAnalytics}>
                  {tCommon('retry')}
                </Button>
              }
            />
          </motion.section>
        ) : (
          <motion.section
            className="dashboard-grid dashboard-grid--charts"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <Card className="chart-panel chart-panel--primary" tone="subtle">
              <div className="chart-panel-head">
                <div>
                  <Badge tone="accent">{tNav('progress')}</Badge>
                  <h3>{t('performanceTitle')}</h3>
                  <p>{t('performanceDesc')}</p>
                </div>
              </div>

              {analyticsLoading ? (
                <Skeleton className="chart-skeleton" variant="panel" />
              ) : hasPerformanceData ? (
                <PerformanceChart data={analyticsData.performance} />
              ) : (
                <EmptyState compact title={t('performanceEmptyTitle')} description={t('performanceEmptyDesc')} />
              )}
            </Card>

            <Card className="chart-panel chart-panel--secondary" tone="subtle">
              <div className="chart-panel-head">
                <div>
                  <Badge tone="neutral">{tNav('activity')}</Badge>
                  <h3>{t('submissionTrendTitle')}</h3>
                  <p>{t('submissionTrendDesc')}</p>
                </div>
              </div>

              {analyticsLoading ? (
                <Skeleton className="chart-skeleton" variant="panel" />
              ) : hasSubmissionData ? (
                <SubmissionChart data={analyticsData.submissions} />
              ) : (
                <EmptyState
                  compact
                  title={t('submissionTrendEmptyTitle')}
                  description={t('submissionTrendEmptyDesc')}
                />
              )}
            </Card>
          </motion.section>
        )}

        <motion.section
          id="courses"
          className="dashboard-section"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={3}
        >
          <div className="dashboard-section-head">
            <div className="section-intro">
              <Badge tone="accent">{tNav('courses')}</Badge>
              <h2>{tWorkspace('courseSectionTitle')}</h2>
              <p>{tWorkspace('courseSectionDesc')}</p>
            </div>

            <Button variant="secondary" onClick={() => setActiveModal('join')}>
              {tWorkspace('joinCourse')}
            </Button>
          </div>

          {coursesError ? (
            <StatePanel compact variant="error" title={tWorkspace('coursesLoadError')} description={coursesError} />
          ) : coursesLoading ? (
            <div className="course-grid">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="course-card-skeleton" variant="panel" />
              ))}
            </div>
          ) : courses.length ? (
            <div className="course-grid">
              {courses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  className={`selection-card selection-card--course ${selectedCourseId === course.id ? 'is-active' : ''}`}
                  onClick={() => setSelectedCourseId(course.id)}
                  aria-pressed={selectedCourseId === course.id}
                >
                  <CourseCard
                    course={course}
                    subtitle={`${t('teacherPrefix')}: ${course.teacher?.name || t('unknownTeacher')}`}
                    actionLabel={selectedCourseId === course.id ? tCommon('selected') : tCommon('openWorkspace')}
                    selected={selectedCourseId === course.id}
                  />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              title={t('noCoursesTitle')}
              description={t('noCoursesDesc')}
              action={<Button onClick={() => setActiveModal('join')}>{tWorkspace('joinCourse')}</Button>}
            />
          )}
        </motion.section>

        <motion.section
          className="dashboard-grid dashboard-grid--workspace dashboard-grid--workspace-focus"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={4}
        >
          <Card id="assignments" className="workspace-panel workspace-panel--primary" tone="subtle">
            <div className="dashboard-section-head">
              <div className="section-intro">
                <Badge tone="accent">{tNav('assignments')}</Badge>
                <h2>{tWorkspace('assignmentSectionTitle')}</h2>
                <p>{tWorkspace('assignmentSectionDesc')}</p>
              </div>
            </div>

            {selectedCourse ? (
              <div className="surface-meta-strip">
                <Badge tone="neutral">{selectedCourse.code}</Badge>
                <span>{selectedCourse.title}</span>
              </div>
            ) : null}

            {assignmentsError ? (
              <StatePanel compact variant="error" title={tWorkspace('assignmentsLoadError')} description={assignmentsError} />
            ) : assignmentsLoading ? (
              <div className="assignment-stack">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="assignment-card-skeleton" variant="panel" />
                ))}
              </div>
            ) : assignments.length ? (
              <div className="assignment-stack">
                {assignments.map((assignment) => {
                  const mySubmission = assignment.submissions?.[0] || null;
                  const dueState = formatDueState(assignment.dueDate, locale, tCommon);
                  const progress = assignment.progress || null;

                  return (
                    <AssignmentRow
                      key={assignment.id}
                      title={assignment.title}
                      description={assignment.description || tWorkspace('assignmentNoDescription')}
                      meta={[
                        assignment.course?.title || t('courseUnavailable'),
                        `${t('maximumScore')}: ${assignment.maxScore}`
                      ]}
                      progress={
                        progress
                          ? {
                              value: progress.progressPercent,
                              label: tWorkspace('assignmentProgressLabel'),
                              helper: formatProgressState(progress.state, tCommon),
                              tone: getProgressTone(progress.progressPercent)
                            }
                          : null
                      }
                      statusLabel={mySubmission ? formatStatusLabel(mySubmission.status, tCommon) : dueState.label}
                      statusTone={mySubmission ? getSubmissionTone(mySubmission.status) : dueState.tone}
                      dueLabel={`${t('duePrefix')} ${formatDate(assignment.dueDate, locale)}`}
                      actionLabel={
                        mySubmission?.status === 'draft'
                          ? tWorkspace('continueSubmission')
                          : mySubmission
                            ? tWorkspace('updateSubmission')
                            : tWorkspace('submitAssignment')
                      }
                      selected={selectedAssignmentId === assignment.id}
                      onSelect={() => handleSelectAssignment(assignment.id)}
                      onAction={() => handleOpenSubmission(assignment)}
                    />
                  );
                })}
              </div>
            ) : selectedCourse ? (
              <EmptyState title={t('noPendingTitle')} description={t('noPendingDesc')} />
            ) : (
              <EmptyState title={tWorkspace('noCourseSelected')} description={tWorkspace('selectCourseHint')} />
            )}
          </Card>

          <Card id="completed" className="workspace-rail workspace-rail--accent" tone="subtle">
            <div className="dashboard-section-head">
              <div className="section-intro">
                <Badge tone="neutral">{tNav('completed')}</Badge>
                <h2>{t('recentSubmissions')}</h2>
                <p>{t('recentSubmissionsDesc')}</p>
              </div>
            </div>

            {dashboard?.recentSubmissions?.length ? (
              <div className="review-stack">
                {dashboard.recentSubmissions.map((submission) => (
                  <article className="review-entry" key={submission.id}>
                    <div className="review-entry-head">
                      <div>
                        <strong>{submission.assignment?.title || t('assignmentUnavailable')}</strong>
                        <p>{submission.assignment?.course?.title || t('courseUnavailable')}</p>
                      </div>
                      <Badge tone={getSubmissionTone(submission.status)}>
                        {formatStatusLabel(submission.status, tCommon)}
                      </Badge>
                    </div>

                    <p className="review-entry-copy">
                      {t('submittedPrefix')} {formatDate(submission.submittedAt, locale)}
                    </p>

                    <div className="review-entry-foot">
                      <span>
                        {submission.grade !== null && submission.grade !== undefined
                          ? `${tWorkspace('submissionGradeLabel')}: ${submission.grade}`
                          : `${tWorkspace('submissionStatusLabel')}: ${formatStatusLabel(submission.status, tCommon)}`}
                      </span>
                      {submission.feedback ? (
                        <span>{tWorkspace('submissionFeedback', { feedback: submission.feedback })}</span>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState compact title={t('noSubmissionsTitle')} description={t('noSubmissionsDesc')} />
            )}
          </Card>
        </motion.section>

        <motion.section
          id="activity"
          className="dashboard-section dashboard-section--activity"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={5}
        >
          <Card className="timeline-surface timeline-surface--featured" tone="subtle">
            <div className="dashboard-section-head">
              <div className="section-intro">
                <Badge tone="neutral">{tNav('activity')}</Badge>
                <h2>{tWorkspace('activitySectionTitle')}</h2>
                <p>{tWorkspace('activitySectionDesc')}</p>
              </div>
            </div>

            {activitiesError ? (
              <StatePanel compact variant="error" title={tWorkspace('activityLoadError')} description={activitiesError} />
            ) : activitiesLoading ? (
              <Skeleton className="activity-skeleton" variant="panel" />
            ) : (
              <ActivityFeed activities={activities} />
            )}
          </Card>
        </motion.section>
      </AnimatedPage>

      <Modal
        open={activeModal === 'join'}
        onClose={() => setActiveModal('')}
        title={tWorkspace('joinCourse')}
        description={tWorkspace('courseSectionDesc')}
      >
        <CourseJoinForm onSubmit={handleJoinCourse} onSuccess={() => setActiveModal('')} />
      </Modal>

      <Modal
        open={activeModal === 'submit' && Boolean(selectedAssignment)}
        onClose={() => {
          setActiveModal('');
        }}
        title={selectedAssignment?.title || tWorkspace('submitAssignment')}
        description={
          selectedAssignment
            ? `${t('duePrefix')} ${formatDate(selectedAssignment.dueDate, locale)}`
            : tWorkspace('assignmentSectionDesc')
        }
      >
        {selectedAssignment ? (
          <SubmissionComposer
            assignment={selectedAssignment}
            submission={selectedSubmission}
            progress={selectedAssignment.progress}
            onDraft={handleSaveDraft}
            onSubmit={handleSubmitAssignment}
            onSuccess={() => {
              setActiveModal('');
            }}
          />
        ) : null}
      </Modal>
    </AppShell>
  );
}

export default function StudentDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={PROTECTED_ROUTE_ROLES.studentOnly}>
      <StudentDashboardContent />
    </ProtectedRoute>
  );
}
