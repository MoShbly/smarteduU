'use client';

import { BookMarked, Clock3, FileCheck2, GraduationCap } from 'lucide-react';

import AuthGuard from '@/components/auth/AuthGuard';
import CourseCard from '@/components/dashboard/CourseCard';
import DashboardCard from '@/components/dashboard/DashboardCard';
import AppShell from '@/components/layout/AppShell';
import AnimatedPage from '@/components/motion/AnimatedPage';
import StatePanel from '@/components/ui/StatePanel';
import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiRequest } from '@/lib/api';

const dashboardSections = [
  { href: '#overview', label: 'Overview' },
  { href: '#assignments', label: 'Assignments' },
  { href: '#courses', label: 'Courses' },
  { href: '#progress', label: 'Progress' }
];

const formatDate = (value) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));

function StudentDashboardContent() {
  const { token } = useAuth();
  const { data, loading, error, reload } = useApiQuery(
    async () => {
      const [dashboardResponse, assignmentsResponse] = await Promise.all([
        apiRequest('/dashboard/student', { token }),
        apiRequest('/assignments', { token })
      ]);

      return {
        dashboard: dashboardResponse.data,
        assignments: assignmentsResponse.data.assignments
      };
    },
    [token],
    {
      enabled: Boolean(token),
      initialData: {
        dashboard: null,
        assignments: []
      }
    }
  );

  const metrics = data?.dashboard?.metrics || {
    enrolledCourses: 0,
    pendingAssignments: 0,
    submittedAssignments: 0
  };

  const content = () => {
    if (loading && !data?.dashboard) {
      return (
        <>
          <section className="stat-card-grid">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="skeleton-card" />
            ))}
            <div className="skeleton-card" />
          </section>

          <section className="dashboard-grid">
            <div className="dashboard-stack">
              <div className="skeleton-card" />
              <div className="skeleton-card" />
            </div>
            <div className="dashboard-stack">
              <div className="skeleton-card" />
              <div className="skeleton-card" />
            </div>
          </section>
        </>
      );
    }

    if (error && !data?.dashboard) {
      return (
        <StatePanel
          variant="error"
          title="Unable to load the student dashboard"
          description={error}
          action={
            <button type="button" className="button secondary-button" onClick={reload}>
              Try again
            </button>
          }
        />
      );
    }

    return (
      <>
        {error ? (
          <StatePanel
            variant="error"
            compact
            title="Some information is currently unavailable"
            description={error}
            action={
              <button type="button" className="button secondary-button" onClick={reload}>
                Retry
              </button>
            }
          />
        ) : null}

        <section id="overview" className="hero-banner">
          <span className="eyebrow">Student Workspace</span>
          <h2>Stay on top of courses, deadlines, and submission progress with a clear modern layout.</h2>
          <p>
            This dashboard highlights what matters most to students during a demo: current courses,
            pending assignments, and recent submission activity in a clean academic interface.
          </p>
          <div className="hero-meta">
            <span>Responsive dashboard layout</span>
            <span>Protected role-based navigation</span>
            <span>Soft motion and polished loading states</span>
          </div>
        </section>

        <section className="stat-card-grid">
          <DashboardCard
            label="Enrolled Courses"
            value={metrics.enrolledCourses}
            helper="Active class spaces"
            icon={GraduationCap}
            accent="primary"
          />
          <DashboardCard
            label="Pending Work"
            value={metrics.pendingAssignments}
            helper="Assignments still awaiting submission"
            icon={Clock3}
            accent="gold"
          />
          <DashboardCard
            label="Submitted"
            value={metrics.submittedAssignments}
            helper="Completed coursework"
            icon={FileCheck2}
            accent="teal"
          />
          <DashboardCard
            label="Available Tasks"
            value={data?.assignments?.length || 0}
            helper="Assignments visible in your feed"
            icon={BookMarked}
            accent="rose"
          />
        </section>

        <section className="dashboard-grid">
          <div className="dashboard-stack">
            <article id="assignments" className="panel">
              <div className="panel-header">
                <div>
                  <h3>Upcoming Assignments</h3>
                  <p className="panel-copy">Work ordered by due date to keep students focused.</p>
                </div>
              </div>

              <div className="list-stack">
                {data?.dashboard?.upcomingAssignments?.length ? (
                  data.dashboard.upcomingAssignments.map((assignment) => (
                    <div className="list-row" key={assignment.id}>
                      <strong>{assignment.title}</strong>
                      <span>
                        {assignment.course?.title || 'Course unavailable'} • Due{' '}
                        {formatDate(assignment.dueDate)}
                      </span>
                      <small>Maximum score: {assignment.maxScore}</small>
                    </div>
                  ))
                ) : (
                  <StatePanel
                    compact
                    title="No pending assignments"
                    description="You are fully caught up or no new assignments have been posted yet."
                  />
                )}
              </div>
            </article>

            <article id="courses" className="panel">
              <div className="panel-header">
                <div>
                  <h3>Course Spaces</h3>
                  <p className="panel-copy">A quick overview of the classrooms you are enrolled in.</p>
                </div>
              </div>

              {data?.dashboard?.courses?.length ? (
                <div className="course-grid">
                  {data.dashboard.courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      subtitle={`Teacher: ${course.teacher?.name || 'Unknown'}`}
                    />
                  ))}
                </div>
              ) : (
                <StatePanel
                  compact
                  title="No enrolled courses yet"
                  description="Course cards will appear here once the student is enrolled."
                />
              )}
            </article>
          </div>

          <div className="dashboard-stack">
            <article id="progress" className="panel">
              <div className="panel-header">
                <div>
                  <h3>Recent Submissions</h3>
                  <p className="panel-copy">Your latest delivered work, organized for review.</p>
                </div>
              </div>

              <div className="list-stack">
                {data?.dashboard?.recentSubmissions?.length ? (
                  data.dashboard.recentSubmissions.map((submission) => (
                    <div className="list-row" key={submission.id}>
                      <strong>{submission.assignment?.title || 'Assignment unavailable'}</strong>
                      <span>
                        {submission.assignment?.course?.title || 'Course unavailable'} •{' '}
                        {submission.status}
                      </span>
                      <small>Submitted {formatDate(submission.submittedAt)}</small>
                    </div>
                  ))
                ) : (
                  <StatePanel
                    compact
                    title="No submissions yet"
                    description="Completed work will appear here after the student submits assignments."
                  />
                )}
              </div>
            </article>

            <article className="panel">
              <div className="panel-header">
                <div>
                  <h3>Recent Activity</h3>
                  <p className="panel-copy">A quick timeline of your latest platform actions.</p>
                </div>
              </div>

              <div className="list-stack">
                {data?.dashboard?.recentActivities?.length ? (
                  data.dashboard.recentActivities.map((activity) => (
                    <div className="list-row" key={activity.id}>
                      <strong>{activity.action}</strong>
                      <span>{activity.entityType}</span>
                      <small>{formatDate(activity.createdAt)}</small>
                    </div>
                  ))
                ) : (
                  <StatePanel
                    compact
                    title="No activity yet"
                    description="Student actions such as logging in or submitting work will appear here."
                  />
                )}
              </div>
            </article>
          </div>
        </section>
      </>
    );
  };

  return (
    <AppShell
      title="Student Dashboard"
      description="A focused academic workspace for tracking progress and upcoming coursework."
      sections={dashboardSections}
    >
      <AnimatedPage className="dashboard-page">{content()}</AnimatedPage>
    </AppShell>
  );
}

export default function StudentDashboardPage() {
  return (
    <AuthGuard allowedRoles={['student']}>
      <StudentDashboardContent />
    </AuthGuard>
  );
}
