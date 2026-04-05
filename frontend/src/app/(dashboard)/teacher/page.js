'use client';

import { BookOpenCheck, FileCheck2, FileText, UsersRound } from 'lucide-react';

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
  { href: '#courses', label: 'Courses' },
  { href: '#assignments', label: 'Assignments' },
  { href: '#activity', label: 'Activity' }
];

const formatDate = (value) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));

function TeacherDashboardContent() {
  const { token } = useAuth();
  const { data, loading, error, reload } = useApiQuery(
    async () => {
      const [dashboardResponse, coursesResponse] = await Promise.all([
        apiRequest('/dashboard/teacher', { token }),
        apiRequest('/courses', { token })
      ]);

      return {
        dashboard: dashboardResponse.data,
        courses: coursesResponse.data.courses
      };
    },
    [token],
    {
      enabled: Boolean(token),
      initialData: {
        dashboard: null,
        courses: []
      }
    }
  );

  const metrics = data?.dashboard?.metrics || {
    totalCourses: 0,
    totalStudents: 0,
    totalAssignments: 0,
    totalSubmissions: 0
  };

  const content = () => {
    if (loading && !data?.dashboard) {
      return (
        <>
          <section className="stat-card-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="skeleton-card" />
            ))}
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
          title="Unable to load the teacher dashboard"
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
            title="Some data could not be refreshed"
            description={error}
            action={
              <button type="button" className="button secondary-button" onClick={reload}>
                Retry
              </button>
            }
          />
        ) : null}

        <section id="overview" className="hero-banner">
          <span className="eyebrow">Teacher Command Center</span>
          <h2>Monitor your classes, assignments, and submission flow in one polished workspace.</h2>
          <p>
            This dashboard gives a clean academic overview designed for a graduation project demo,
            with role-based metrics, course highlights, and recent classroom activity.
          </p>
          <div className="hero-meta">
            <span>PostgreSQL + Prisma backend</span>
            <span>JWT protected access</span>
            <span>Responsive academic SaaS layout</span>
          </div>
        </section>

        <section className="stat-card-grid">
          <DashboardCard
            label="Active Courses"
            value={metrics.totalCourses}
            helper="Current teaching spaces"
            icon={BookOpenCheck}
            accent="primary"
          />
          <DashboardCard
            label="Students Reached"
            value={metrics.totalStudents}
            helper="Distinct enrolled learners"
            icon={UsersRound}
            accent="teal"
          />
          <DashboardCard
            label="Assignments"
            value={metrics.totalAssignments}
            helper="Published classroom work"
            icon={FileText}
            accent="gold"
          />
          <DashboardCard
            label="Submissions"
            value={metrics.totalSubmissions}
            helper="Work delivered by students"
            icon={FileCheck2}
            accent="rose"
          />
        </section>

        <section className="dashboard-grid">
          <div className="dashboard-stack">
            <article id="courses" className="panel">
              <div className="panel-header">
                <div>
                  <h3>Course Portfolio</h3>
                  <p className="panel-copy">A high-level view of all teacher-managed courses.</p>
                </div>
              </div>

              {data?.courses?.length ? (
                <div className="course-grid">
                  {data.courses.map((course) => (
                    <CourseCard key={course.id} course={course} subtitle="Managed course space" />
                  ))}
                </div>
              ) : (
                <StatePanel
                  compact
                  title="No courses created yet"
                  description="Create your first course to start organizing assignments and student enrollment."
                />
              )}
            </article>

            <article id="assignments" className="panel">
              <div className="panel-header">
                <div>
                  <h3>Recent Assignments</h3>
                  <p className="panel-copy">The latest coursework published across your classes.</p>
                </div>
              </div>

              <div className="list-stack">
                {data?.dashboard?.recentAssignments?.length ? (
                  data.dashboard.recentAssignments.map((assignment) => (
                    <div className="list-row" key={assignment.id}>
                      <strong>{assignment.title}</strong>
                      <span>
                        {assignment.course?.title || 'Course unavailable'} • Due{' '}
                        {formatDate(assignment.dueDate)}
                      </span>
                      <small>{assignment._count?.submissions ?? 0} submissions tracked</small>
                    </div>
                  ))
                ) : (
                  <StatePanel
                    compact
                    title="No assignments yet"
                    description="Assignments will appear here once teachers start publishing coursework."
                  />
                )}
              </div>
            </article>
          </div>

          <div className="dashboard-stack">
            <article id="activity" className="panel">
              <div className="panel-header">
                <div>
                  <h3>Recent Submissions</h3>
                  <p className="panel-copy">Latest student deliveries across teacher-owned courses.</p>
                </div>
              </div>

              <div className="list-stack">
                {data?.dashboard?.recentSubmissions?.length ? (
                  data.dashboard.recentSubmissions.map((submission) => (
                    <div className="list-row" key={submission.id}>
                      <strong>{submission.assignment?.title || 'Assignment unavailable'}</strong>
                      <span>{submission.student?.name || 'Unknown student'}</span>
                      <small>Submitted {formatDate(submission.submittedAt)}</small>
                    </div>
                  ))
                ) : (
                  <StatePanel
                    compact
                    title="No submissions yet"
                    description="Incoming student work will appear here once assignments are submitted."
                  />
                )}
              </div>
            </article>

            <article className="panel">
              <div className="panel-header">
                <div>
                  <h3>Activity Timeline</h3>
                  <p className="panel-copy">A concise record of your recent classroom actions.</p>
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
                    title="No recent activity"
                    description="Teacher actions such as course creation and assignment publishing will appear here."
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
      title="Teacher Dashboard"
      description="A modern classroom control center for managing academic activity."
      sections={dashboardSections}
    >
      <AnimatedPage className="dashboard-page">{content()}</AnimatedPage>
    </AppShell>
  );
}

export default function TeacherDashboardPage() {
  return (
    <AuthGuard allowedRoles={['teacher']}>
      <TeacherDashboardContent />
    </AuthGuard>
  );
}
