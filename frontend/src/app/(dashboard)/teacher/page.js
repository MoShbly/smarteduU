'use client';

import { motion } from 'framer-motion';
import {
  BookOpenCheck,
  CalendarClock,
  ClipboardCheck,
  FilePlus2,
  FileText,
  FolderPlus,
  ScanSearch,
  Sparkles,
  UsersRound
} from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { formatDate, formatDueState, formatStatusLabel, getSubmissionTone } from '@/lib/dashboard';
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

function TeacherDashboardContent() {
  const t = useTranslations('teacherDashboard');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
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
        submissions: []
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

  const reloadWorkspace = () => {
    reloadDashboard();
    reloadCourses();
    reloadAssignments();
    reloadReview();
    reloadActivities();
    reloadAnalytics();
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
    reloadDashboard();
    reloadAssignments();
    reloadActivities();
    reloadAnalytics();
    setSelectedAssignmentId(assignment.id);
    return assignment;
  };

  const handleReviewSubmission = async (submissionId, payload) => {
    const submission = await submissionService.reviewSubmission(submissionId, payload, token);
    reloadDashboard();
    reloadReview();
    reloadActivities();
    reloadAnalytics();
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
          className="dashboard-section"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <div className="dashboard-section-head">
            <div className="section-intro">
              <Badge tone="accent">{t('heroEyebrow')}</Badge>
              <h2>{t('heroTitle')}</h2>
              <p>{t('heroDescription')}</p>
            </div>
          </div>

          <div className="dashboard-stats-grid">
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
            <StatCard
              label={t('metricSubmissions')}
              value={metrics.pendingSubmissions}
              helper={t('metricSubmissionsHelper')}
              icon={ClipboardCheck}
              accent="rose"
            />
          </div>
        </motion.section>

        <motion.section
          id="insights"
          className="dashboard-section"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          <Card className="insight-spotlight" tone="soft">
            <div className="insight-spotlight-head">
              <div className="section-intro">
                <Badge tone="accent">{tNav('insights')}</Badge>
                <h2>{t('focusPendingReviews')}</h2>
                <p>{t('focusPendingReviewsDesc', { count: metrics.pendingSubmissions })}</p>
              </div>

              <div className="insight-spotlight-summary">
                <span>{selectedCourse?.code || '--'}</span>
                <small>{selectedCourse?.title || tWorkspace('noCourseSelected')}</small>
              </div>
            </div>

            <div className="insight-spotlight-grid">
              <InsightCard
                eyebrow={t('focusPendingReviews')}
                value={metrics.pendingSubmissions}
                title={tWorkspace('reviewSectionTitle')}
                description={tWorkspace('reviewSectionDesc')}
                accent="rose"
                icon={ClipboardCheck}
              />
              <InsightCard
                eyebrow={tWorkspace('focusSelectedCourse')}
                value={selectedCourse?.code || '--'}
                title={selectedCourse?.title || tWorkspace('noCourseSelected')}
                description={
                  selectedCourse
                    ? `${selectedCourse.subject || tWorkspace('noSubject')} · ${selectedCourse._count?.enrollments ?? 0} ${t('metricStudents').toLowerCase()}`
                    : tWorkspace('selectCourseHint')
                }
                accent="primary"
                icon={BookOpenCheck}
              />
              <InsightCard
                eyebrow={tWorkspace('focusSelectedAssignment')}
                value={selectedAssignment ? formatDate(selectedAssignment.dueDate, locale) : '--'}
                title={selectedAssignment?.title || tWorkspace('noAssignmentSelected')}
                description={
                  selectedAssignment
                    ? `${selectedAssignment._count?.submissions ?? 0} ${t('submissionsTracked')}`
                    : tWorkspace('selectAssignmentHint')
                }
                accent="gold"
                icon={CalendarClock}
              />
              <InsightCard
                eyebrow={tNav('activity')}
                value={recentActivity ? formatDate(recentActivity.createdAt, locale) : '--'}
                title={recentActivity ? formatStatusLabel(recentActivity.action) : t('noActivityTitle')}
                description={
                  recentActivity
                    ? recentActivity.details?.title ||
                      recentActivity.details?.assignmentTitle ||
                      recentActivity.details?.courseTitle ||
                      tWorkspace('activitySectionDesc')
                    : t('noActivityDesc')
                }
                accent="teal"
                icon={Sparkles}
              />
            </div>
          </Card>

          <InsightsPanel
            loading={analyticsLoading}
            insights={analyticsData?.insights || []}
            weakStudents={analyticsData?.weakStudents || []}
            topStudents={analyticsData?.topStudents || []}
            riskStudents={analyticsData?.riskStudents || []}
          />
        </motion.section>

        <motion.section
          className="dashboard-grid dashboard-grid--charts"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          <Card className="chart-panel" tone="subtle">
            <div className="chart-panel-head">
              <div>
                <Badge tone="accent">{t('performanceTitle')}</Badge>
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

          <Card className="chart-panel" tone="subtle">
            <div className="chart-panel-head">
              <div>
                <Badge tone="neutral">{t('submissionsTrendTitle')}</Badge>
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
        </motion.section>

        <motion.section
          className="dashboard-grid dashboard-grid--workspace"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={4}
        >
          <Card id="assignments" className="workspace-panel" tone="subtle">
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

                  return (
                    <AssignmentRow
                      key={assignment.id}
                      title={assignment.title}
                      description={assignment.description || ''}
                      meta={[
                        assignment.course?.title || t('courseUnavailable'),
                        `${assignment._count?.submissions ?? 0} ${t('submissionsTracked')}`
                      ]}
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

          <Card id="review" className="workspace-rail" tone="subtle">
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

                {reviewData.submissions.length ? (
                  <div className="review-stack">
                    {reviewData.submissions.map((submission) => (
                      <article className="review-entry" key={submission.id}>
                        <div className="review-entry-head">
                          <div>
                            <strong>{submission.student?.name || t('unknownStudent')}</strong>
                            <p>{formatDate(submission.submittedAt, locale)}</p>
                          </div>
                          <Badge tone={getSubmissionTone(submission.status)}>
                            {formatStatusLabel(submission.status)}
                          </Badge>
                        </div>

                        <p className="review-entry-copy">{submission.content}</p>

                        <div className="review-entry-foot">
                          <span>
                            {submission.grade !== null && submission.grade !== undefined
                              ? `${tWorkspace('reviewGrade')}: ${submission.grade}`
                              : tWorkspace('reviewStatus')}
                          </span>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setReviewTarget(submission);
                              setActiveModal('review');
                            }}
                            icon={ScanSearch}
                          >
                            {tWorkspace('reviewSubmit')}
                          </Button>
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
          className="dashboard-section"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={5}
        >
          <Card className="timeline-surface" tone="subtle">
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
