'use client';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  BookOpenCheck,
  CalendarClock,
  ClipboardCheck,
  FilePlus2,
  FileText,
  FolderPlus,
  ScanSearch,
  Sparkles,
  Trophy,
  UsersRound
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import InsightsPanel from '@/components/ai/InsightsPanel';
import ActivityFeed from '@/components/classroom/ActivityFeed';
import AssignmentCreateForm from '@/components/classroom/AssignmentCreateForm';
import CourseCreateForm from '@/components/classroom/CourseCreateForm';
import SubmissionReviewForm from '@/components/classroom/SubmissionReviewForm';
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
  formatActivityLabel,
  formatDate,
  formatDueState,
  formatProgressState,
  formatStatusLabel,
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
import ProgressMeter from '@/components/ui/ProgressMeter';
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

function AnalyticsListCard({ title, description, items, emptyTitle, emptyDescription, renderItem }) {
  return (
    <Card className="analytics-list-card" tone="subtle">
      <div className="analytics-list-head">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      {items.length ? (
        <div className="analytics-list-body">
          {items.map(renderItem)}
        </div>
      ) : (
        <EmptyState compact title={emptyTitle} description={emptyDescription} />
      )}
    </Card>
  );
}

function TeacherDashboardContent() {
  const t = useTranslations('teacherDashboard');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const tActivity = useTranslations('activityFeed');
  const tWorkspace = useTranslations('teacherWorkspace');
  const locale = useLocale();
  const { token } = useAuth();
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [activeModal, setActiveModal] = useState('');
  const [reviewTarget, setReviewTarget] = useState(null);

  const dashboardSections = [
    { href: '#overview', label: tNav('overview') },
    { href: '#insights', label: tNav('insights') },
    { href: '#courses', label: tNav('courses') },
    { href: '#assignments', label: tNav('assignments') },
    { href: '#review', label: tNav('review') },
    { href: '#activity', label: tNav('activity') }
  ];

  const {
    data: dashboard,
    loading: dashboardLoading,
    error: dashboardError,
    reload: reloadDashboard
  } = useApiQuery(() => dashboardService.getTeacherOverview(token), [token], {
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
    data: reviewData,
    loading: reviewLoading,
    error: reviewError,
    reload: reloadReview
  } = useApiQuery(
    () => submissionService.getAssignmentSubmissions(selectedAssignmentId, token),
    [token, selectedAssignmentId],
    {
      enabled: Boolean(token && selectedAssignmentId),
      initialData: {
        assignment: null,
        submissions: [],
        studentProgress: []
      }
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
  const metrics = dashboard?.metrics || {
    totalCourses: 0,
    totalStudents: 0,
    totalAssignments: 0,
    pendingSubmissions: 0
  };
  const hasPerformanceData = Boolean(analyticsData?.performance?.length);
  const hasSubmissionData = Boolean(analyticsData?.submissions?.length);
  const recentActivity = activities[0] || null;
  const selectedCourseStudents = selectedCourse?.enrollments || [];
  const recentActivityTitle = recentActivity ? formatActivityLabel(recentActivity.action, tActivity) : '';
  const recentActivityDescription =
    recentActivity?.details?.title ||
    recentActivity?.details?.assignmentTitle ||
    recentActivity?.details?.courseTitle ||
    tWorkspace('activitySectionDesc');
  const overviewHighlights = [
    selectedCourse
      ? {
          label: tWorkspace('focusSelectedCourse'),
          value: selectedCourse.code,
          detail: selectedCourse.title
        }
      : null,
    selectedAssignment
      ? {
          label: tWorkspace('focusSelectedAssignment'),
          value: formatDate(selectedAssignment.dueDate, locale),
          detail: selectedAssignment.title
        }
      : null,
    recentActivity
      ? {
          label: tNav('activity'),
          value: formatDate(recentActivity.createdAt, locale),
          detail: recentActivityTitle
        }
      : null
  ].filter(Boolean);

  const analyticsCards = useMemo(
    () => [
      {
        id: 'support',
        label: t('supportStudentsLabel'),
        value: analyticsData?.summary?.supportStudentsCount ?? 0,
        helper: t('supportStudentsHelper'),
        caption: t('supportStudentsCaption'),
        tone: 'warning',
        icon: AlertTriangle
      },
      {
        id: 'top',
        label: t('topStudentsLabel'),
        value: analyticsData?.summary?.topStudentsCount ?? 0,
        helper: t('topStudentsHelper'),
        caption: t('topStudentsCaption'),
        tone: 'success',
        icon: Trophy
      },
      {
        id: 'delayed',
        label: t('delayedStudentsLabel'),
        value: analyticsData?.summary?.delayedStudentsCount ?? 0,
        helper: t('delayedStudentsHelper'),
        caption: t('delayedStudentsCaption'),
        tone: 'warning',
        icon: ClipboardCheck
      },
      {
        id: 'courses',
        label: t('courseRiskLabel'),
        value: analyticsData?.summary?.lowCompletionCoursesCount ?? 0,
        helper: t('courseRiskHelper'),
        caption: t('courseRiskCaption'),
        tone: 'accent',
        icon: BookOpenCheck
      }
    ],
    [analyticsData?.summary, t]
  );

  const reloadWorkspace = () => {
    reloadDashboard();
    reloadCourses();
    reloadAssignments();
    reloadReview();
    reloadActivities();
    reloadAnalytics();
  };

  const refreshTeacherData = () => {
    reloadDashboard();
    reloadAssignments();
    reloadReview();
    reloadActivities();
    reloadAnalytics();
    reloadCourses();
  };

  const handleCreateCourse = async (payload) => {
    const course = await courseService.createCourse(payload, token);
    reloadDashboard();
    reloadCourses();
    reloadActivities();
    setSelectedCourseId(course.id);
    return course;
  };

  const handleCreateAssignment = async (payload) => {
    const assignment = await assignmentService.createAssignment(payload, token);
    refreshTeacherData();
    setSelectedAssignmentId(assignment.id);
    return assignment;
  };

  const handleReviewSubmission = async (submissionId, payload) => {
    const submission = await submissionService.reviewSubmission(submissionId, payload, token);
    refreshTeacherData();
    return submission;
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
        <>
          <Button variant="secondary" icon={FolderPlus} onClick={() => setActiveModal('course')}>
            {tWorkspace('createCourse')}
          </Button>
          <Button icon={FilePlus2} onClick={() => setActiveModal('assignment')} disabled={!selectedCourse}>
            {tWorkspace('createAssignment')}
          </Button>
        </>
      }
    >
      <AnimatedPage className="dashboard-page dashboard-page--teacher">
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
          <Card className="dashboard-hero-banner dashboard-hero-banner--teacher" tone="soft">
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
              label={t('metricSubmissions')}
              value={metrics.pendingSubmissions}
              helper={t('metricSubmissionsHelper')}
              icon={ClipboardCheck}
              accent="rose"
              featured
            />
            <StatCard
              label={t('metricCourses')}
              value={metrics.totalCourses}
              helper={t('metricCoursesHelper')}
              icon={BookOpenCheck}
              accent="primary"
            />
            <StatCard
              label={t('metricStudents')}
              value={metrics.totalStudents}
              helper={t('metricStudentsHelper')}
              icon={UsersRound}
              accent="teal"
            />
            <StatCard
              label={t('metricAssignments')}
              value={metrics.totalAssignments}
              helper={t('metricAssignmentsHelper')}
              icon={FileText}
              accent="gold"
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
          <Card className="insight-spotlight insight-spotlight--teacher" tone="soft">
            <div className="insight-spotlight-head">
              <div className="section-intro">
                <Badge tone="accent">{tNav('insights')}</Badge>
                <h2>{t('focusPendingReviews')}</h2>
                <p>{t('focusPendingReviewsDesc', { count: metrics.pendingSubmissions })}</p>
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
              <InsightCard
                eyebrow={t('focusPendingReviews')}
                value={metrics.pendingSubmissions}
                title={tWorkspace('reviewSectionTitle')}
                description={tWorkspace('reviewSectionDesc')}
                accent="rose"
                icon={ClipboardCheck}
                featured
              />
              {selectedCourse ? (
                <InsightCard
                  eyebrow={tWorkspace('focusSelectedCourse')}
                  value={selectedCourse.code}
                  title={selectedCourse.title}
                  description={`${selectedCourse.subject || tWorkspace('noSubject')} · ${selectedCourse._count?.enrollments ?? 0} ${t('metricStudents').toLowerCase()}`}
                  accent="primary"
                  icon={BookOpenCheck}
                />
              ) : null}
              {selectedAssignment ? (
                <InsightCard
                  eyebrow={tWorkspace('focusSelectedAssignment')}
                  value={formatDate(selectedAssignment.dueDate, locale)}
                  title={selectedAssignment.title}
                  description={`${selectedAssignment.progressSummary?.submittedCount ?? 0} ${t('submissionsTracked')}`}
                  accent="gold"
                  icon={CalendarClock}
                />
              ) : null}
              {recentActivity ? (
                <InsightCard
                  eyebrow={tNav('activity')}
                  value={formatDate(recentActivity.createdAt, locale)}
                  title={recentActivityTitle}
                  description={recentActivityDescription}
                  accent="teal"
                  icon={Sparkles}
                />
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
            <>
              <InsightsPanel
                loading={analyticsLoading}
                title={t('analyticsPanelTitle')}
                description={t('analyticsPanelDesc')}
                insights={analyticsData?.insights || []}
                cards={analyticsCards}
              />

              <div className="analytics-grid">
                <AnalyticsListCard
                  title={t('topStudentsTitle')}
                  description={t('topStudentsDesc')}
                  items={analyticsData?.strongestStudents || []}
                  emptyTitle={t('topStudentsEmptyTitle')}
                  emptyDescription={t('topStudentsEmptyDesc')}
                  renderItem={(student) => (
                    <article className="analytics-row" key={student.id}>
                      <div>
                        <strong>{student.name}</strong>
                        <p>{student.averageScore}%</p>
                      </div>
                      <small>{t('completedAssignmentsStat', { count: student.completedAssignments })}</small>
                    </article>
                  )}
                />

                <AnalyticsListCard
                  title={t('supportStudentsTitle')}
                  description={t('supportStudentsDesc')}
                  items={analyticsData?.weakestStudents || []}
                  emptyTitle={t('supportStudentsEmptyTitle')}
                  emptyDescription={t('supportStudentsEmptyDesc')}
                  renderItem={(student) => (
                    <article className="analytics-row" key={student.id}>
                      <div>
                        <strong>{student.name}</strong>
                        <p>
                          {student.averageScore !== null && student.averageScore !== undefined
                            ? `${student.averageScore}%`
                            : t('noGradesLabel')}
                        </p>
                      </div>
                      <small>{t('pendingAssignmentsStat', { count: student.pendingAssignmentsCount })}</small>
                    </article>
                  )}
                />

                <AnalyticsListCard
                  title={t('delayedStudentsTitle')}
                  description={t('delayedStudentsDesc')}
                  items={analyticsData?.delayedStudents || []}
                  emptyTitle={t('delayedStudentsEmptyTitle')}
                  emptyDescription={t('delayedStudentsEmptyDesc')}
                  renderItem={(student) => (
                    <article className="analytics-row" key={student.id}>
                      <div>
                        <strong>{student.name}</strong>
                        <p>{t('delayedAssignmentsStat', { count: student.delayedAssignmentsCount })}</p>
                      </div>
                      <small>{t('consistencyStat', { value: student.consistencyRate ?? 0 })}</small>
                    </article>
                  )}
                />

                <AnalyticsListCard
                  title={t('courseRiskTitle')}
                  description={t('courseRiskDesc')}
                  items={analyticsData?.lowCompletionCourses || []}
                  emptyTitle={t('courseRiskEmptyTitle')}
                  emptyDescription={t('courseRiskEmptyDesc')}
                  renderItem={(course) => (
                    <article className="analytics-row" key={course.id}>
                      <div>
                        <strong>{course.title}</strong>
                        <p>{course.completionRate}%</p>
                      </div>
                      <small>{course.code}</small>
                    </article>
                  )}
                />

                <AnalyticsListCard
                  title={t('assignmentRiskTitle')}
                  description={t('assignmentRiskDesc')}
                  items={analyticsData?.lowestAssignments || []}
                  emptyTitle={t('assignmentRiskEmptyTitle')}
                  emptyDescription={t('assignmentRiskEmptyDesc')}
                  renderItem={(assignment) => (
                    <article className="analytics-row" key={assignment.id}>
                      <div>
                        <strong>{assignment.title}</strong>
                        <p>{assignment.averageScore}%</p>
                      </div>
                      <small>{assignment.courseTitle}</small>
                    </article>
                  )}
                />
              </div>
            </>
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
                  <h3>{t('submissionsTrendTitle')}</h3>
                  <p>{t('submissionsTrendDesc')}</p>
                </div>
              </div>

              {analyticsLoading ? (
                <Skeleton className="chart-skeleton" variant="panel" />
              ) : hasSubmissionData ? (
                <SubmissionChart data={analyticsData.submissions} />
              ) : (
                <EmptyState
                  compact
                  title={t('submissionsTrendEmptyTitle')}
                  description={t('submissionsTrendEmptyDesc')}
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

            <Button variant="secondary" icon={FolderPlus} onClick={() => setActiveModal('course')}>
              {tWorkspace('createCourse')}
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
                    subtitle={`${tWorkspace('courseCode')}: ${course.code}`}
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
              action={<Button onClick={() => setActiveModal('course')}>{tWorkspace('createCourse')}</Button>}
            />
          )}

          {selectedCourse ? (
            <Card className="workspace-panel" tone="subtle">
              <div className="dashboard-section-head">
                <div className="section-intro">
                  <Badge tone="neutral">
                    {tWorkspace('studentRosterCount', { count: selectedCourseStudents.length })}
                  </Badge>
                  <h2>{tWorkspace('studentRosterTitle')}</h2>
                  <p>{tWorkspace('studentRosterDesc')}</p>
                </div>
              </div>

              <div className="surface-meta-strip">
                <Badge tone="accent">{selectedCourse.code}</Badge>
                <span>{selectedCourse.title}</span>
              </div>

              {selectedCourseStudents.length ? (
                <div className="student-roster">
                  {selectedCourseStudents.map((enrollment) => (
                    <article className="student-roster-item" key={enrollment.id}>
                      <strong>{enrollment.student.name}</strong>
                      <p>{enrollment.student.email}</p>
                      <ProgressMeter
                        value={enrollment.courseProgress?.progressPercent}
                        label={tWorkspace('studentProgressLabel')}
                        helper={tWorkspace('studentProgressHelper', {
                          completed: enrollment.courseProgress?.completedAssignments ?? 0,
                          total: enrollment.courseProgress?.totalAssignments ?? 0
                        })}
                        compact
                        tone={getProgressTone(enrollment.courseProgress?.progressPercent)}
                      />
                      <small>{tWorkspace('studentRosterJoined', { date: formatDate(enrollment.enrolledAt, locale) })}</small>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  compact
                  title={tWorkspace('studentRosterEmptyTitle')}
                  description={tWorkspace('studentRosterEmptyDesc')}
                />
              )}
            </Card>
          ) : null}
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

              <Button
                variant="secondary"
                icon={FilePlus2}
                onClick={() => setActiveModal('assignment')}
                disabled={!selectedCourse}
              >
                {tWorkspace('createAssignment')}
              </Button>
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
                  const dueState = formatDueState(assignment.dueDate, locale, tCommon);
                  const progressSummary = assignment.progressSummary || null;

                  return (
                    <AssignmentRow
                      key={assignment.id}
                      title={assignment.title}
                      description={assignment.description || ''}
                      meta={[
                        assignment.course?.title || t('courseUnavailable'),
                        `${progressSummary?.submittedCount ?? 0} ${t('submissionsTracked')}`
                      ]}
                      progress={
                        progressSummary
                          ? {
                              value: progressSummary.completionRate,
                              label: tWorkspace('assignmentCompletionLabel'),
                              helper: tWorkspace('assignmentCompletionHelper', {
                                submitted: progressSummary.submittedCount,
                                total: progressSummary.totalStudents
                              }),
                              tone: getProgressTone(progressSummary.completionRate)
                            }
                          : null
                      }
                      statusLabel={dueState.label || formatDate(assignment.dueDate, locale)}
                      statusTone={dueState.tone}
                      dueLabel={`${t('duePrefix')} ${formatDate(assignment.dueDate, locale)}`}
                      actionLabel={tNav('review')}
                      selected={selectedAssignmentId === assignment.id}
                      onSelect={() => setSelectedAssignmentId(assignment.id)}
                      onAction={() => setSelectedAssignmentId(assignment.id)}
                    />
                  );
                })}
              </div>
            ) : selectedCourse ? (
              <EmptyState
                title={t('noAssignmentsTitle')}
                description={t('noAssignmentsDesc')}
                action={<Button onClick={() => setActiveModal('assignment')}>{tWorkspace('createAssignment')}</Button>}
              />
            ) : (
              <EmptyState title={tWorkspace('noCourseSelected')} description={tWorkspace('selectCourseHint')} />
            )}
          </Card>

          <Card id="review" className="workspace-rail workspace-rail--accent" tone="subtle">
            <div className="dashboard-section-head">
              <div className="section-intro">
                <Badge tone="neutral">{tNav('review')}</Badge>
                <h2>{tWorkspace('reviewSectionTitle')}</h2>
                <p>{tWorkspace('reviewSectionDesc')}</p>
              </div>
            </div>

            {reviewError ? (
              <StatePanel compact variant="error" title={tWorkspace('reviewLoadError')} description={reviewError} />
            ) : reviewLoading ? (
              <div className="review-stack">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="review-card-skeleton" variant="panel" />
                ))}
              </div>
            ) : reviewData?.assignment ? (
              <>
                <div className="review-context">
                  <Badge tone="accent">{reviewData.assignment.course.title}</Badge>
                  <strong>{reviewData.assignment.title}</strong>
                  <p>{tWorkspace('maxScoreLabel', { value: reviewData.assignment.maxScore })}</p>
                </div>

                {reviewData.studentProgress?.length ? (
                  <div className="review-stack">
                    {reviewData.studentProgress.map((entry) => (
                      <article className="review-entry" key={entry.student.id}>
                        <div className="review-entry-head">
                          <div>
                            <strong>{entry.student.name}</strong>
                            <p>{entry.student.email}</p>
                          </div>
                          <Badge tone={entry.submission ? getSubmissionTone(entry.submission.status) : 'neutral'}>
                            {entry.submission
                              ? formatStatusLabel(entry.submission.status, tCommon)
                              : formatProgressState(entry.progress.state, tCommon)}
                          </Badge>
                        </div>

                        <ProgressMeter
                          value={entry.progress.progressPercent}
                          label={tWorkspace('studentProgressLabel')}
                          helper={formatProgressState(entry.progress.state, tCommon)}
                          compact
                          tone={getProgressTone(entry.progress.progressPercent)}
                        />

                        {entry.submission?.content ? (
                          <p className="review-entry-copy">{entry.submission.content}</p>
                        ) : (
                          <p className="review-entry-copy">{tWorkspace('reviewNoSubmissionCopy')}</p>
                        )}

                        {entry.submission?.attachmentUrl ? (
                          <p className="review-entry-resource">
                            <a
                              className="resource-link"
                              href={entry.submission.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {tWorkspace('reviewAttachmentLink', {
                                name: entry.submission.attachmentName || tWorkspace('reviewAttachmentDefault')
                              })}
                            </a>
                          </p>
                        ) : null}

                        <div className="review-entry-foot">
                          <span>
                            {entry.submission?.grade !== null && entry.submission?.grade !== undefined
                              ? `${tWorkspace('reviewGrade')}: ${entry.submission.grade}`
                              : entry.isLate
                                ? tWorkspace('reviewLateLabel')
                                : tWorkspace('reviewStatus') + ': ' + formatProgressState(entry.progress.state, tCommon)}
                          </span>
                          {entry.submission?.feedback ? <span>{entry.submission.feedback}</span> : null}
                          {entry.submission && entry.submission.status !== 'draft' ? (
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setReviewTarget(entry.submission);
                                setActiveModal('review');
                              }}
                              icon={ScanSearch}
                            >
                              {tWorkspace('reviewSubmit')}
                            </Button>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState title={tWorkspace('noSubmissionsTitle')} description={tWorkspace('noSubmissionsDesc')} />
                )}
              </>
            ) : (
              <EmptyState title={tWorkspace('noAssignmentSelected')} description={tWorkspace('selectAssignmentHint')} />
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
        open={activeModal === 'course'}
        onClose={() => setActiveModal('')}
        title={tWorkspace('createCourse')}
        description={tWorkspace('courseSectionDesc')}
      >
        <CourseCreateForm onSubmit={handleCreateCourse} onSuccess={() => setActiveModal('')} />
      </Modal>

      <Modal
        open={activeModal === 'assignment'}
        onClose={() => setActiveModal('')}
        title={tWorkspace('createAssignment')}
        description={
          selectedCourse
            ? tWorkspace('assignmentCourseHint', {
                title: selectedCourse.title,
                code: selectedCourse.code
              })
            : tWorkspace('assignmentSelectCourse')
        }
      >
        <AssignmentCreateForm
          course={selectedCourse}
          onSubmit={handleCreateAssignment}
          onSuccess={() => setActiveModal('')}
        />
      </Modal>

      <Modal
        open={activeModal === 'review' && Boolean(reviewTarget)}
        onClose={() => {
          setActiveModal('');
          setReviewTarget(null);
        }}
        title={reviewTarget?.student?.name || t('unknownStudent')}
        description={selectedAssignment?.title || tWorkspace('reviewSectionTitle')}
      >
        {reviewTarget ? (
          <SubmissionReviewForm
            submission={reviewTarget}
            maxScore={reviewData?.assignment?.maxScore || selectedAssignment?.maxScore || 100}
            onSubmit={handleReviewSubmission}
            onSuccess={() => {
              setActiveModal('');
              setReviewTarget(null);
            }}
          />
        ) : null}
      </Modal>
    </AppShell>
  );
}

export default function TeacherDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={PROTECTED_ROUTE_ROLES.teacherOnly}>
      <TeacherDashboardContent />
    </ProtectedRoute>
  );
}
