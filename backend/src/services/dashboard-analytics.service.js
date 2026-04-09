import prisma from '../lib/prisma.js';
import { isFinalSubmissionStatus } from '../constants/progress.js';
import { userSummarySelect, assignmentInclude, submissionInclude } from '../utils/selects.js';
import {
  assignmentProgressSelect,
  buildAssignmentProgressIndex,
  buildAssignmentProgressSnapshot,
  calculateAssignmentProgressSummary,
  calculateCourseProgress,
  getIndexedAssignmentProgress,
  submissionProgressSelect
} from './progress.service.js';
import { getRelevantActivities } from './activity-log.service.js';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const LOW_SCORE_THRESHOLD = 60;
const HIGH_SCORE_THRESHOLD = 85;
const LOW_COMPLETION_THRESHOLD = 70;
const LOW_CONSISTENCY_THRESHOLD = 60;

const toCompactLabel = (value = '') =>
  value.length > 12 ? `${value.slice(0, 12)}...` : value;

const averageFromNumbers = (values = []) => {
  if (!values.length) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + Number(value || 0), 0);
  return Math.round(total / values.length);
};

const buildSevenDayLabels = (now) => {
  const labels = [];

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - index);
    labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
  }

  return labels;
};

const buildSubmissionSeries = (submissions = [], now = new Date()) => {
  const dayLabels = buildSevenDayLabels(now);
  const counts = Object.fromEntries(dayLabels.map((label) => [label, 0]));
  const cutoff = new Date(now.getTime() - 6 * DAY_IN_MS);

  submissions.forEach((submission) => {
    if (!submission?.submittedAt || submission.submittedAt < cutoff) {
      return;
    }

    const label = submission.submittedAt.toLocaleDateString('en-US', { weekday: 'short' });
    if (counts[label] !== undefined) {
      counts[label] += 1;
    }
  });

  return dayLabels.map((label) => ({
    label,
    count: counts[label]
  }));
};

const buildTrend = (gradedItems = []) => {
  if (gradedItems.length < 4) {
    return {
      direction: null,
      delta: null
    };
  }

  const recent = gradedItems.slice(-3);
  const previous = gradedItems.slice(-6, -3);

  if (previous.length < 2) {
    return {
      direction: null,
      delta: null
    };
  }

  const recentAverage = averageFromNumbers(recent.map((item) => item.grade));
  const previousAverage = averageFromNumbers(previous.map((item) => item.grade));
  const delta = recentAverage - previousAverage;

  if (delta >= 5) {
    return {
      direction: 'improving',
      delta
    };
  }

  if (delta <= -5) {
    return {
      direction: 'declining',
      delta
    };
  }

  return {
    direction: 'stable',
    delta
  };
};

const buildConsistency = (assignmentRows = [], now = new Date()) => {
  const dueRows = assignmentRows
    .filter((row) => row.assignment.dueDate && row.assignment.dueDate <= now)
    .sort((left, right) => left.assignment.dueDate - right.assignment.dueDate);

  if (!dueRows.length) {
    return {
      rate: null,
      onTimeCount: 0,
      dueCount: 0,
      recentChange: null
    };
  }

  const isOnTime = (row) =>
    row.isCompleted && row.submittedAt && row.assignment.dueDate && row.submittedAt <= row.assignment.dueDate;

  const onTimeCount = dueRows.filter(isOnTime).length;
  const rate = Math.round((onTimeCount / dueRows.length) * 100);

  const recent = dueRows.slice(-3);
  const previous = dueRows.slice(-6, -3);
  let recentChange = null;

  if (recent.length >= 2 && previous.length >= 2) {
    const recentRate = Math.round((recent.filter(isOnTime).length / recent.length) * 100);
    const previousRate = Math.round((previous.filter(isOnTime).length / previous.length) * 100);
    recentChange = recentRate - previousRate;
  }

  return {
    rate,
    onTimeCount,
    dueCount: dueRows.length,
    recentChange
  };
};

const buildStudentAssignmentRows = ({ courses = [], progressMap, submissionMap, studentId, now }) =>
  courses.flatMap((course) =>
    (course.assignments || []).map((assignment) => {
      const submission = submissionMap.get(`${assignment.id}:${studentId}`) || null;
      const progress = getIndexedAssignmentProgress({
        assignmentId: assignment.id,
        studentId,
        progressMap,
        submissionMap
      });
      const submittedAt = submission?.submittedAt || progress.submittedAt;
      const isCompleted = progress.progressPercent >= 100 || isFinalSubmissionStatus(submission?.status);
      const isLate =
        assignment.dueDate &&
        ((isCompleted && submittedAt && submittedAt > assignment.dueDate) ||
          (!isCompleted && assignment.dueDate < now));

      return {
        assignment,
        course,
        submission,
        progress,
        submittedAt,
        isCompleted,
        isLate
      };
    })
  );

const flattenTeacherProgressData = (courses = []) => {
  const progressRecords = [];
  const submissions = [];

  courses.forEach((course) => {
    (course.assignments || []).forEach((assignment) => {
      progressRecords.push(...(assignment.progressRecords || []));
      submissions.push(...(assignment.submissions || []));
    });
  });

  return buildAssignmentProgressIndex(progressRecords, submissions);
};

const loadTeacherDataset = (teacherId) =>
  prisma.course.findMany({
    where: {
      teacherId,
      isArchived: false
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      title: true,
      description: true,
      code: true,
      subject: true,
      createdAt: true,
      enrollments: {
        where: {
          status: 'active'
        },
        orderBy: {
          enrolledAt: 'desc'
        },
        select: {
          id: true,
          studentId: true,
          enrolledAt: true,
          student: {
            select: userSummarySelect
          }
        }
      },
      assignments: {
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          description: true,
          dueDate: true,
          maxScore: true,
          status: true,
          createdAt: true,
          courseId: true,
          submissions: {
            select: submissionProgressSelect
          },
          progressRecords: {
            select: assignmentProgressSelect
          }
        }
      }
    }
  });

const loadStudentDataset = (studentId) =>
  prisma.enrollment.findMany({
    where: {
      studentId,
      status: 'active',
      course: {
        isArchived: false
      }
    },
    orderBy: {
      enrolledAt: 'desc'
    },
    select: {
      id: true,
      enrolledAt: true,
      course: {
        select: {
          id: true,
          title: true,
          description: true,
          code: true,
          subject: true,
          createdAt: true,
          teacher: {
            select: userSummarySelect
          },
          assignments: {
            orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
            select: {
              id: true,
              title: true,
              description: true,
              dueDate: true,
              maxScore: true,
              status: true,
              createdAt: true,
              courseId: true,
              submissions: {
                where: {
                  studentId
                },
                select: submissionProgressSelect
              },
              progressRecords: {
                where: {
                  studentId
                },
                select: assignmentProgressSelect
              }
            }
          }
        }
      }
    }
  });

const buildTeacherStudentSnapshots = ({ courses, now }) => {
  const { progressMap, submissionMap } = flattenTeacherProgressData(courses);
  const courseById = new Map(courses.map((course) => [course.id, course]));
  const studentMap = new Map();

  courses.forEach((course) => {
    const assignmentIds = course.assignments.map((assignment) => assignment.id);

    course.enrollments.forEach((enrollment) => {
      const studentId = enrollment.studentId;

      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          id: enrollment.student.id,
          name: enrollment.student.name,
          email: enrollment.student.email,
          avatarUrl: enrollment.student.avatarUrl,
          courseIds: [],
          assignmentRows: [],
          courseProgress: []
        });
      }

      const studentSnapshot = studentMap.get(studentId);
      studentSnapshot.courseIds.push(course.id);
      studentSnapshot.courseProgress.push({
        courseId: course.id,
        courseTitle: course.title,
        code: course.code,
        ...calculateCourseProgress({
          assignmentIds,
          studentId,
          progressMap,
          submissionMap
        })
      });

      course.assignments.forEach((assignment) => {
        const submission = submissionMap.get(`${assignment.id}:${studentId}`) || null;
        const progress = getIndexedAssignmentProgress({
          assignmentId: assignment.id,
          studentId,
          progressMap,
          submissionMap
        });
        const submittedAt = submission?.submittedAt || progress.submittedAt;
        const isCompleted = progress.progressPercent >= 100 || isFinalSubmissionStatus(submission?.status);
        const isLate =
          assignment.dueDate &&
          ((isCompleted && submittedAt && submittedAt > assignment.dueDate) ||
            (!isCompleted && assignment.dueDate < now));

        studentSnapshot.assignmentRows.push({
          assignment,
          course,
          submission,
          progress,
          submittedAt,
          isCompleted,
          isLate
        });
      });
    });
  });

  return {
    courseById,
    progressMap,
    submissionMap,
    students: Array.from(studentMap.values()).map((student) => {
      const gradedSubmissions = student.assignmentRows
        .map((row) => row.submission)
        .filter((submission) => submission?.grade !== null && submission?.grade !== undefined)
        .sort((left, right) => left.submittedAt - right.submittedAt);
      const averageScore = averageFromNumbers(gradedSubmissions.map((submission) => submission.grade));
      const consistency = buildConsistency(student.assignmentRows, now);
      const trend = buildTrend(gradedSubmissions);
      const totalAssignments = student.assignmentRows.length;
      const completedAssignments = student.assignmentRows.filter((row) => row.isCompleted).length;
      const delayedAssignmentsCount = student.assignmentRows.filter((row) => row.isLate).length;
      const pendingAssignmentsCount = totalAssignments - completedAssignments;
      const averageProgressPercent = averageFromNumbers(
        student.assignmentRows.map((row) => row.progress.progressPercent)
      );

      return {
        ...student,
        gradedAssignments: gradedSubmissions.length,
        averageScore,
        consistencyRate: consistency.rate,
        consistencyChange: consistency.recentChange,
        trend,
        totalAssignments,
        completedAssignments,
        pendingAssignmentsCount,
        delayedAssignmentsCount,
        averageProgressPercent
      };
    })
  };
};

const buildTeacherCourseSignals = ({ courses, progressMap, submissionMap, now }) =>
  courses.map((course) => {
    const studentIds = course.enrollments.map((enrollment) => enrollment.studentId);
    const assignmentIds = course.assignments.map((assignment) => assignment.id);
    const studentProgress = studentIds.map((studentId) =>
      calculateCourseProgress({
        assignmentIds,
        studentId,
        progressMap,
        submissionMap
      })
    );
    const assignmentSummaries = course.assignments.map((assignment) =>
      calculateAssignmentProgressSummary({
        assignment,
        studentIds,
        progressMap,
        submissionMap,
        now
      })
    );
    const expectedSubmissions = studentIds.length * assignmentIds.length;
    const submittedCount = assignmentSummaries.reduce(
      (sum, summary) => sum + summary.submittedCount,
      0
    );

    return {
      id: course.id,
      title: course.title,
      code: course.code,
      studentsCount: studentIds.length,
      assignmentsCount: assignmentIds.length,
      averageProgressPercent: averageFromNumbers(
        studentProgress
          .map((progress) => progress.progressPercent)
          .filter((value) => value !== null)
      ),
      completionRate:
        expectedSubmissions > 0
          ? Math.round((submittedCount / expectedSubmissions) * 100)
          : null,
      submittedCount,
      expectedSubmissions,
      pendingExpectedCount: expectedSubmissions - submittedCount
    };
  });

export const buildTeacherDashboard = async (teacherId) => {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * DAY_IN_MS);
  const [courses, recentAssignments, recentSubmissions, recentActivities] = await Promise.all([
    loadTeacherDataset(teacherId),
    prisma.assignment.findMany({
      where: {
        course: {
          teacherId,
          isArchived: false
        }
      },
      include: assignmentInclude,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      take: 8
    }),
    prisma.submission.findMany({
      where: {
        status: {
          in: ['submitted', 'graded', 'pending']
        },
        assignment: {
          course: {
            teacherId,
            isArchived: false
          }
        }
      },
      include: submissionInclude,
      orderBy: {
        submittedAt: 'desc'
      },
      take: 8
    }),
    getRelevantActivities({
      userId: teacherId,
      role: 'teacher',
      take: 8
    })
  ]);

  const distinctStudents = new Set(
    courses.flatMap((course) => course.enrollments.map((enrollment) => enrollment.studentId))
  );
  const totalAssignments = courses.reduce(
    (sum, course) => sum + course.assignments.length,
    0
  );
  const pendingSubmissions = courses.reduce(
    (sum, course) =>
      sum +
      course.assignments.reduce(
        (assignmentSum, assignment) =>
          assignmentSum +
          assignment.submissions.filter((submission) =>
            ['submitted', 'pending'].includes(submission.status)
          ).length,
        0
      ),
    0
  );
  const upcomingDeadlines = courses.reduce(
    (sum, course) =>
      sum +
      course.assignments.filter(
        (assignment) => assignment.dueDate > now && assignment.dueDate <= nextWeek
      ).length,
    0
  );
  const insights = [];

  if (pendingSubmissions > 0) {
    insights.push({
      id: 'pending_reviews',
      code: 'teacher_pending_reviews',
      type: 'warning',
      values: {
        count: pendingSubmissions
      }
    });
  }

  if (upcomingDeadlines > 0) {
    insights.push({
      id: 'upcoming_deadlines',
      code: 'teacher_upcoming_deadlines',
      type: 'neutral',
      values: {
        count: upcomingDeadlines
      }
    });
  }

  if (!insights.length) {
    insights.push({
      id: 'all_clear',
      code: 'teacher_dashboard_clear',
      type: 'success',
      values: {}
    });
  }

  return {
    metrics: {
      totalCourses: courses.length,
      totalStudents: distinctStudents.size,
      totalAssignments,
      pendingSubmissions
    },
    insights,
    recentAssignments,
    recentSubmissions,
    recentActivities
  };
};

export const buildStudentDashboard = async (studentId) => {
  const now = new Date();
  const [enrollments, recentSubmissions, recentActivities] = await Promise.all([
    loadStudentDataset(studentId),
    prisma.submission.findMany({
      where: {
        studentId,
        status: {
          in: ['submitted', 'graded', 'pending']
        }
      },
      include: submissionInclude,
      orderBy: {
        submittedAt: 'desc'
      },
      take: 8
    }),
    getRelevantActivities({
      userId: studentId,
      role: 'student',
      take: 8
    })
  ]);

  const courses = enrollments.map((enrollment) => enrollment.course);
  const progressRecords = courses.flatMap((course) =>
    course.assignments.flatMap((assignment) => assignment.progressRecords)
  );
  const submissions = courses.flatMap((course) =>
    course.assignments.flatMap((assignment) => assignment.submissions)
  );
  const { progressMap, submissionMap } = buildAssignmentProgressIndex(progressRecords, submissions);
  const assignmentRows = buildStudentAssignmentRows({
    courses,
    progressMap,
    submissionMap,
    studentId,
    now
  });
  const pendingAssignments = assignmentRows
    .filter((row) => !row.isCompleted)
    .sort((left, right) => left.assignment.dueDate - right.assignment.dueDate);

  return {
    metrics: {
      enrolledCourses: courses.length,
      pendingAssignments: pendingAssignments.length,
      completedAssignments: assignmentRows.filter((row) => row.isCompleted).length
    },
    upcomingAssignments: pendingAssignments.slice(0, 8).map((row) => ({
      ...row.assignment,
      course: {
        id: row.course.id,
        title: row.course.title,
        code: row.course.code,
        subject: row.course.subject
      },
      progress: row.progress,
      submissions: row.submission ? [row.submission] : []
    })),
    recentSubmissions,
    recentActivities
  };
};

export const buildTeacherAnalytics = async (teacherId) => {
  const now = new Date();
  const courses = await loadTeacherDataset(teacherId);
  const { progressMap, submissionMap, students } = buildTeacherStudentSnapshots({
    courses,
    now
  });
  const courseSignals = buildTeacherCourseSignals({
    courses,
    progressMap,
    submissionMap,
    now
  });
  const allAssignments = courses.flatMap((course) =>
    course.assignments.map((assignment) => ({
      ...assignment,
      course: {
        id: course.id,
        title: course.title,
        code: course.code
      }
    }))
  );
  const allFinalSubmissions = allAssignments.flatMap((assignment) =>
    assignment.submissions.filter((submission) => isFinalSubmissionStatus(submission.status))
  );

  const strongestStudentsAll = students
    .filter((student) => student.averageScore !== null)
    .sort((left, right) => {
      if (right.averageScore !== left.averageScore) {
        return right.averageScore - left.averageScore;
      }

      return (right.averageProgressPercent ?? 0) - (left.averageProgressPercent ?? 0);
    });

  const weakestStudentsAll = students
    .filter(
      (student) =>
        student.averageScore !== null ||
        student.pendingAssignmentsCount > 0 ||
        student.delayedAssignmentsCount > 0
    )
    .sort((left, right) => {
      const leftScore = left.averageScore ?? Infinity;
      const rightScore = right.averageScore ?? Infinity;

      if (leftScore !== rightScore) {
        return leftScore - rightScore;
      }

      if (right.pendingAssignmentsCount !== left.pendingAssignmentsCount) {
        return right.pendingAssignmentsCount - left.pendingAssignmentsCount;
      }

      return right.delayedAssignmentsCount - left.delayedAssignmentsCount;
    });

  const delayedStudentsAll = students
    .filter((student) => student.delayedAssignmentsCount > 0)
    .sort((left, right) => {
      if (right.delayedAssignmentsCount !== left.delayedAssignmentsCount) {
        return right.delayedAssignmentsCount - left.delayedAssignmentsCount;
      }

      return (left.consistencyRate ?? 101) - (right.consistencyRate ?? 101);
    });

  const lowestAssignmentsAll = allAssignments
    .map((assignment) => {
      const gradedSubmissions = assignment.submissions.filter(
        (submission) => submission.grade !== null && submission.grade !== undefined
      );

      return {
        id: assignment.id,
        title: assignment.title,
        courseTitle: assignment.course.title,
        averageScore: averageFromNumbers(gradedSubmissions.map((submission) => submission.grade)),
        gradedCount: gradedSubmissions.length,
        ...calculateAssignmentProgressSummary({
          assignment,
          studentIds: courses
            .find((course) => course.id === assignment.course.id)
            ?.enrollments.map((enrollment) => enrollment.studentId) || [],
          progressMap,
          submissionMap,
          now
        })
      };
    })
    .filter((assignment) => assignment.averageScore !== null)
    .sort((left, right) => left.averageScore - right.averageScore);

  const lowCompletionCoursesAll = courseSignals
    .filter(
      (course) =>
        course.completionRate !== null && course.completionRate < LOW_COMPLETION_THRESHOLD
    )
    .sort((left, right) => left.completionRate - right.completionRate);
  const strongestStudents = strongestStudentsAll.slice(0, 5);
  const weakestStudents = weakestStudentsAll.slice(0, 5);
  const delayedStudents = delayedStudentsAll.slice(0, 5);
  const lowestAssignments = lowestAssignmentsAll.slice(0, 5);
  const lowCompletionCourses = lowCompletionCoursesAll.slice(0, 5);

  const insights = [];

  if (lowCompletionCourses.length) {
    insights.push({
      id: 'teacher_low_completion_course',
      code: 'teacher_low_completion_course',
      type: 'warning',
      values: {
        courseTitle: lowCompletionCourses[0].title,
        completionRate: lowCompletionCourses[0].completionRate
      }
    });
  }

  if (delayedStudents.length) {
    insights.push({
      id: 'teacher_delayed_students',
      code: 'teacher_delayed_students',
      type: 'warning',
      values: {
        studentName: delayedStudents[0].name,
        count: delayedStudents[0].delayedAssignmentsCount
      }
    });
  }

  if (lowestAssignments.length && lowestAssignments[0].averageScore < LOW_SCORE_THRESHOLD) {
    insights.push({
      id: 'teacher_low_scoring_assignment',
      code: 'teacher_low_scoring_assignment',
      type: 'warning',
      values: {
        assignmentTitle: lowestAssignments[0].title,
        score: lowestAssignments[0].averageScore
      }
    });
  }

  if (weakestStudents.length) {
    const focusStudent = weakestStudents[0];
    insights.push({
      id: 'teacher_student_support',
      code:
        focusStudent.averageScore !== null && focusStudent.averageScore !== undefined
          ? 'teacher_student_support'
          : 'teacher_missing_work',
      type: 'warning',
      values:
        focusStudent.averageScore !== null && focusStudent.averageScore !== undefined
          ? {
              studentName: focusStudent.name,
              score: focusStudent.averageScore
            }
          : {
              studentName: focusStudent.name,
              count: focusStudent.pendingAssignmentsCount
            }
    });
  }

  if (strongestStudents.length) {
    insights.push({
      id: 'teacher_top_students',
      code: 'teacher_top_students',
      type: 'success',
      values: {
        studentName: strongestStudents[0].name,
        score: strongestStudents[0].averageScore
      }
    });
  }

  if (!insights.length) {
    insights.push({
      id: 'teacher_no_signals',
      code: 'teacher_no_signals',
      type: 'neutral',
      values: {}
    });
  }

  const recentAssignments = allAssignments
    .map((assignment) => {
      const gradedSubmissions = assignment.submissions.filter(
        (submission) => submission.grade !== null && submission.grade !== undefined
      );

      return {
        label: toCompactLabel(assignment.title),
        score: averageFromNumbers(gradedSubmissions.map((submission) => submission.grade)),
        createdAt: assignment.createdAt
      };
    })
    .filter((assignment) => assignment.score !== null)
    .sort((left, right) => left.createdAt - right.createdAt)
    .slice(-6)
    .map(({ createdAt: _createdAt, ...item }) => item);

  return {
    performance: recentAssignments,
    submissions: buildSubmissionSeries(allFinalSubmissions, now),
      strongestStudents,
      weakestStudents,
      delayedStudents,
      lowestAssignments,
      lowCompletionCourses,
      insights,
      summary: {
      supportStudentsCount: weakestStudentsAll.length,
      topStudentsCount: strongestStudentsAll.length,
      delayedStudentsCount: delayedStudentsAll.length,
      lowCompletionCoursesCount: lowCompletionCoursesAll.length
    }
  };
};

export const buildStudentAnalytics = async (studentId) => {
  const now = new Date();
  const enrollments = await loadStudentDataset(studentId);
  const courses = enrollments.map((enrollment) => enrollment.course);
  const progressRecords = courses.flatMap((course) =>
    course.assignments.flatMap((assignment) => assignment.progressRecords)
  );
  const submissions = courses.flatMap((course) =>
    course.assignments.flatMap((assignment) => assignment.submissions)
  );
  const { progressMap, submissionMap } = buildAssignmentProgressIndex(progressRecords, submissions);
  const assignmentRows = buildStudentAssignmentRows({
    courses,
    progressMap,
    submissionMap,
    studentId,
    now
  });
  const finalSubmissionRows = assignmentRows
    .filter((row) => row.submission && isFinalSubmissionStatus(row.submission.status))
    .sort((left, right) => left.submission.submittedAt - right.submission.submittedAt);
  const finalSubmissions = finalSubmissionRows.map((row) => row.submission);
  const gradedSubmissionRows = finalSubmissionRows.filter(
    (row) => row.submission.grade !== null && row.submission.grade !== undefined
  );
  const gradedSubmissions = gradedSubmissionRows.map((row) => row.submission);
  const courseProgress = courses.map((course) => ({
    id: course.id,
    title: course.title,
    code: course.code,
    ...calculateCourseProgress({
      assignmentIds: course.assignments.map((assignment) => assignment.id),
      studentId,
      progressMap,
      submissionMap
    })
  }));
  const weakestCourse = courseProgress
    .filter((course) => course.progressPercent !== null)
    .sort((left, right) => left.progressPercent - right.progressPercent)[0] || null;
  const consistency = buildConsistency(assignmentRows, now);
  const trend = buildTrend(gradedSubmissions);
  const pendingThisWeek = assignmentRows.filter(
    (row) =>
      !row.isCompleted &&
      row.assignment.dueDate > now &&
      row.assignment.dueDate <= new Date(now.getTime() + 7 * DAY_IN_MS)
  ).length;

  const insights = [];

  if (pendingThisWeek > 0) {
    insights.push({
      id: 'student_pending_due_week',
      code: 'student_pending_due_week',
      type: 'warning',
      values: {
        count: pendingThisWeek
      }
    });
  }

  if (trend.direction === 'improving') {
    insights.push({
      id: 'student_improving_trend',
      code: 'student_improving_trend',
      type: 'success',
      values: {
        delta: trend.delta
      }
    });
  }

  if (trend.direction === 'declining') {
    insights.push({
      id: 'student_declining_trend',
      code: 'student_declining_trend',
      type: 'warning',
      values: {
        delta: Math.abs(trend.delta)
      }
    });
  }

  if (weakestCourse && weakestCourse.progressPercent < LOW_COMPLETION_THRESHOLD) {
    insights.push({
      id: 'student_low_course_progress',
      code: 'student_low_course_progress',
      type: 'warning',
      values: {
        courseTitle: weakestCourse.title,
        progressPercent: weakestCourse.progressPercent
      }
    });
  }

  if (
    consistency.rate !== null &&
    consistency.rate < LOW_CONSISTENCY_THRESHOLD &&
    consistency.recentChange !== null &&
    consistency.recentChange <= -20
  ) {
    insights.push({
      id: 'student_consistency_drop',
      code: 'student_consistency_drop',
      type: 'warning',
      values: {
        difference: Math.abs(consistency.recentChange)
      }
    });
  }

  if (!insights.length) {
    insights.push({
      id: 'student_no_signals',
      code: 'student_no_signals',
      type: 'neutral',
      values: {}
    });
  }

  return {
    performance: gradedSubmissionRows.slice(-6).map((row) => ({
      label: toCompactLabel(row.assignment.title),
      score: row.submission.grade
    })),
    submissions: buildSubmissionSeries(finalSubmissions, now),
    insights,
    summary: {
      averageScore: averageFromNumbers(gradedSubmissions.map((submission) => submission.grade)),
      completedAssignments: assignmentRows.filter((row) => row.isCompleted).length,
      pendingAssignments: assignmentRows.filter((row) => !row.isCompleted).length,
      consistencyRate: consistency.rate,
      trend,
      weakestCourse,
      courseProgress,
      pendingThisWeek
    }
  };
};
