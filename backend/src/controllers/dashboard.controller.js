import prisma from '../lib/prisma.js';
import { getRelevantActivities } from '../services/activity-log.service.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/response.js';
import { assignmentInclude, courseInclude, submissionInclude } from '../utils/selects.js';

const LOW_SCORE_THRESHOLD = 60;
const HIGH_SCORE_THRESHOLD = 85;
const RECENT_ASSIGNMENTS_LIMIT = 5;

const toCompactLabel = (value = '') =>
  value.length > 12 ? `${value.slice(0, 12)}...` : value;

const averageGradeFromSubmissions = (submissions = []) => {
  if (!submissions.length) {
    return null;
  }

  const total = submissions.reduce((sum, submission) => sum + Number(submission.grade || 0), 0);
  return Math.round(total / submissions.length);
};

const buildTeacherStudentAnalytics = async (teacherId, now) => {
  const [recentAssignments, students] = await Promise.all([
    prisma.assignment.findMany({
      where: {
        course: {
          teacherId,
          isArchived: false
        },
        dueDate: {
          lte: now
        }
      },
      orderBy: [
        {
          dueDate: 'desc'
        },
        {
          createdAt: 'desc'
        }
      ],
      take: RECENT_ASSIGNMENTS_LIMIT,
      select: {
        id: true,
        title: true,
        dueDate: true,
        courseId: true,
        course: {
          select: {
            id: true,
            title: true
          }
        }
      }
    }),
    prisma.user.findMany({
      where: {
        role: 'student',
        enrollments: {
          some: {
            status: 'active',
            course: {
              teacherId,
              isArchived: false
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        enrollments: {
          where: {
            status: 'active',
            course: {
              teacherId,
              isArchived: false
            }
          },
          select: {
            courseId: true,
            course: {
              select: {
                title: true,
                code: true
              }
            }
          }
        },
        submissions: {
          where: {
            assignment: {
              course: {
                teacherId,
                isArchived: false
              }
            }
          },
          select: {
            id: true,
            assignmentId: true,
            status: true,
            grade: true,
            submittedAt: true,
            assignment: {
              select: {
                id: true,
                title: true,
                dueDate: true,
                courseId: true,
                course: {
                  select: {
                    title: true
                  }
                }
              }
            }
          }
        }
      }
    })
  ]);

  const studentSnapshots = students.map((student) => {
    const enrolledCourseIds = new Set(student.enrollments.map((enrollment) => enrollment.courseId));
    const relevantRecentAssignments = recentAssignments.filter((assignment) =>
      enrolledCourseIds.has(assignment.courseId)
    );
    const gradedSubmissions = student.submissions.filter(
      (submission) => submission.grade !== null && submission.grade !== undefined
    );
    const averageScore = averageGradeFromSubmissions(gradedSubmissions);
    const missedAssignments = relevantRecentAssignments.filter(
      (assignment) => !student.submissions.some((submission) => submission.assignmentId === assignment.id)
    );
    const latestSubmissionAt = student.submissions.reduce((latest, submission) => {
      if (!submission.submittedAt) {
        return latest;
      }

      return !latest || submission.submittedAt > latest ? submission.submittedAt : latest;
    }, null);

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      avatarUrl: student.avatarUrl,
      averageScore,
      gradedAssignments: gradedSubmissions.length,
      missingAssignmentsCount: missedAssignments.length,
      missedAssignments: missedAssignments.map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        dueDate: assignment.dueDate,
        courseTitle: assignment.course.title
      })),
      courses: student.enrollments.map((enrollment) => ({
        title: enrollment.course.title,
        code: enrollment.course.code
      })),
      latestSubmissionAt
    };
  });

  const lowPerformingStudents = studentSnapshots.filter(
    (student) => student.averageScore !== null && student.averageScore < LOW_SCORE_THRESHOLD
  );
  const weakStudents = studentSnapshots
    .filter(
      (student) =>
        (student.averageScore !== null && student.averageScore < LOW_SCORE_THRESHOLD) ||
        student.missingAssignmentsCount > 0
    )
    .sort((left, right) => {
      if (right.missingAssignmentsCount !== left.missingAssignmentsCount) {
        return right.missingAssignmentsCount - left.missingAssignmentsCount;
      }

      return (left.averageScore ?? Infinity) - (right.averageScore ?? Infinity);
    })
    .slice(0, 6)
    .map((student) => ({
      id: student.id,
      name: student.name,
      averageScore: student.averageScore,
      gradedAssignments: student.gradedAssignments,
      missingAssignmentsCount: student.missingAssignmentsCount,
      missedAssignments: student.missedAssignments,
      reason:
        student.averageScore !== null && student.averageScore < LOW_SCORE_THRESHOLD
          ? student.missingAssignmentsCount > 0
            ? 'low_scores_and_missing_work'
            : 'low_scores'
          : 'missing_work'
    }));

  const topStudents = studentSnapshots
    .filter((student) => student.averageScore !== null && student.averageScore > HIGH_SCORE_THRESHOLD)
    .sort((left, right) => {
      if ((right.averageScore ?? 0) !== (left.averageScore ?? 0)) {
        return (right.averageScore ?? 0) - (left.averageScore ?? 0);
      }

      return right.gradedAssignments - left.gradedAssignments;
    })
    .slice(0, 6)
    .map((student) => ({
      id: student.id,
      name: student.name,
      averageScore: student.averageScore,
      gradedAssignments: student.gradedAssignments
    }));

  const riskStudents = studentSnapshots
    .filter((student) => student.missingAssignmentsCount > 0)
    .sort((left, right) => {
      if (right.missingAssignmentsCount !== left.missingAssignmentsCount) {
        return right.missingAssignmentsCount - left.missingAssignmentsCount;
      }

      if (!left.latestSubmissionAt) {
        return -1;
      }

      if (!right.latestSubmissionAt) {
        return 1;
      }

      return left.latestSubmissionAt - right.latestSubmissionAt;
    })
    .slice(0, 6)
    .map((student) => ({
      id: student.id,
      name: student.name,
      missingAssignmentsCount: student.missingAssignmentsCount,
      missedAssignments: student.missedAssignments,
      latestSubmissionAt: student.latestSubmissionAt
    }));

  const insights = [];

  if (riskStudents.length > 0) {
    insights.push({
      id: 'risk_students',
      type: 'warning',
      message: `${riskStudents.length} students have not submitted recent assignments.`,
      actionHint: 'Review recent work and follow up with missing students.'
    });
  }

  if (lowPerformingStudents.length > 0) {
    insights.push({
      id: 'low_scores',
      type: 'warning',
      message: `${lowPerformingStudents.length} students are consistently scoring below ${LOW_SCORE_THRESHOLD}.`,
      actionHint: 'Check graded work and plan targeted support.'
    });
  }

  if (topStudents.length > 0) {
    insights.push({
      id: 'top_students',
      type: 'success',
      message: `${topStudents.length} students are currently scoring above ${HIGH_SCORE_THRESHOLD}.`,
      actionHint: 'Recognize strong progress or assign extension work.'
    });
  }

  if (!insights.length) {
    insights.push({
      id: 'balanced_classroom',
      type: 'neutral',
      message: 'No immediate student risk detected in recent coursework.',
      actionHint: 'Keep monitoring new submissions and grades.'
    });
  }

  return {
    weakStudents,
    topStudents,
    riskStudents,
    insights
  };
};

const buildTeacherDashboard = async (teacherId) => {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    totalCourses,
    totalAssignments,
    distinctStudents,
    pendingSubmissions,
    courseHighlights,
    recentAssignments,
    recentSubmissions,
    recentActivities,
    upcomingDeadlines
  ] = await Promise.all([
    prisma.course.count({
      where: {
        teacherId,
        isArchived: false
      }
    }),
    prisma.assignment.count({
      where: {
        course: {
          teacherId
        }
      }
    }),
    prisma.enrollment.groupBy({
      by: ['studentId'],
      where: {
        status: 'active',
        course: {
          teacherId
        }
      }
    }),
    prisma.submission.count({
      where: {
        status: {
          in: ['pending', 'submitted']
        },
        assignment: {
          course: {
            teacherId
          }
        }
      }
    }),
    prisma.course.findMany({
      where: {
        teacherId,
        isArchived: false
      },
      include: courseInclude,
      orderBy: {
        createdAt: 'desc'
      },
      take: 6
    }),
    prisma.assignment.findMany({
      where: {
        course: {
          teacherId
        }
      },
      include: assignmentInclude,
      orderBy: [
        {
          dueDate: 'asc'
        },
        {
          createdAt: 'desc'
        }
      ],
      take: 8
    }),
    prisma.submission.findMany({
      where: {
        assignment: {
          course: {
            teacherId
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
    }),
    prisma.assignment.count({
      where: {
        course: {
          teacherId
        },
        dueDate: {
          gt: now,
          lte: nextWeek
        }
      }
    })
  ]);

  const insights = [];

  if (pendingSubmissions > 0) {
    insights.push({
      id: 'pending_reviews',
      type: 'warning',
      count: pendingSubmissions,
      message: `You have ${pendingSubmissions} submissions waiting for review.`,
      actionText: 'Open grading queue'
    });
  }

  if (upcomingDeadlines > 0) {
    insights.push({
      id: 'upcoming_deadlines',
      type: 'info',
      count: upcomingDeadlines,
      message: `${upcomingDeadlines} assignments are due in the next 7 days.`,
      actionText: 'Review deadlines'
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: 'all_clear',
      type: 'success',
      count: 0,
      message: 'Your classroom is up to date.',
      actionText: 'Keep teaching'
    });
  }

  return {
    metrics: {
      totalCourses,
      totalStudents: distinctStudents.length,
      totalAssignments,
      pendingSubmissions
    },
    insights,
    courseHighlights,
    recentAssignments,
    recentSubmissions,
    recentActivities
  };
};

const buildStudentDashboard = async (studentId) => {
  const [
    enrolledCoursesCount,
    pendingAssignmentsCount,
    completedAssignmentsCount,
    courses,
    upcomingAssignments,
    recentSubmissions,
    recentActivities
  ] = await Promise.all([
    prisma.enrollment.count({
      where: {
        studentId,
        status: 'active'
      }
    }),
    prisma.assignment.count({
      where: {
        course: {
          enrollments: {
            some: {
              studentId,
              status: 'active'
            }
          }
        },
        submissions: {
          none: {
            studentId
          }
        }
      }
    }),
    prisma.submission.count({
      where: {
        studentId
      }
    }),
    prisma.course.findMany({
      where: {
        isArchived: false,
        enrollments: {
          some: {
            studentId,
            status: 'active'
          }
        }
      },
      include: courseInclude,
      orderBy: {
        createdAt: 'desc'
      },
      take: 6
    }),
    prisma.assignment.findMany({
      where: {
        course: {
          enrollments: {
            some: {
              studentId,
              status: 'active'
            }
          }
        },
        submissions: {
          none: {
            studentId
          }
        }
      },
      include: assignmentInclude,
      orderBy: {
        dueDate: 'asc'
      },
      take: 8
    }),
    prisma.submission.findMany({
      where: {
        studentId
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

  return {
    metrics: {
      enrolledCourses: enrolledCoursesCount,
      pendingAssignments: pendingAssignmentsCount,
      completedAssignments: completedAssignmentsCount
    },
    courses,
    upcomingAssignments,
    recentSubmissions,
    recentActivities
  };
};

export const getDashboard = catchAsync(async (req, res) => {
  const data =
    req.user.role === 'teacher'
      ? await buildTeacherDashboard(req.user.id)
      : await buildStudentDashboard(req.user.id);

  return sendSuccess(res, {
    data
  });
});

export const getTeacherDashboard = catchAsync(async (req, res) => {
  const data = await buildTeacherDashboard(req.user.id);

  return sendSuccess(res, {
    data
  });
});

export const getStudentDashboard = catchAsync(async (req, res) => {
  const data = await buildStudentDashboard(req.user.id);

  return sendSuccess(res, {
    data
  });
});

export const getAnalytics = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  const now = new Date();
  const past7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const dayLabels = [];
  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(now.getDate() - index);
    dayLabels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
  }

  let performance = [];
  let submissions = [];
  let weakStudents = [];
  let topStudents = [];
  let riskStudents = [];
  let insights = [];

  if (role === 'teacher') {
    const [recentSubmissionDates, recentAssignments, studentAnalytics] = await Promise.all([
      prisma.submission.findMany({
        where: {
          submittedAt: {
            gte: past7Days
          },
          assignment: {
            course: {
              teacherId: userId
            }
          }
        },
        select: {
          submittedAt: true
        }
      }),
      prisma.assignment.findMany({
        where: {
          course: {
            teacherId: userId
          },
          submissions: {
            some: {
              grade: {
                not: null
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 6,
        include: {
          submissions: {
            where: {
              grade: {
                not: null
              }
            },
            select: {
              grade: true
            }
          }
        }
      }),
      buildTeacherStudentAnalytics(userId, now)
    ]);

    const submitCounts = Object.fromEntries(dayLabels.map((label) => [label, 0]));
    recentSubmissionDates.forEach((submission) => {
      const label = submission.submittedAt.toLocaleDateString('en-US', { weekday: 'short' });
      if (submitCounts[label] !== undefined) {
        submitCounts[label] += 1;
      }
    });

    submissions = dayLabels.map((label) => ({
      label,
      count: submitCounts[label]
    }));

    performance = recentAssignments
      .reverse()
      .map((assignment) => {
        const averageGrade = averageGradeFromSubmissions(assignment.submissions);

        return {
          label: toCompactLabel(assignment.title),
          score: averageGrade
        };
      });

    weakStudents = studentAnalytics.weakStudents;
    topStudents = studentAnalytics.topStudents;
    riskStudents = studentAnalytics.riskStudents;
    insights = studentAnalytics.insights;
  }

  if (role === 'student') {
    const [recentSubmissionDates, gradedSubmissions] = await Promise.all([
      prisma.submission.findMany({
        where: {
          studentId: userId,
          submittedAt: {
            gte: past7Days
          }
        },
        select: {
          submittedAt: true
        }
      }),
      prisma.submission.findMany({
        where: {
          studentId: userId,
          grade: {
            not: null
          }
        },
        orderBy: {
          submittedAt: 'desc'
        },
        take: 6,
        include: {
          assignment: {
            select: {
              title: true
            }
          }
        }
      })
    ]);

    const submitCounts = Object.fromEntries(dayLabels.map((label) => [label, 0]));
    recentSubmissionDates.forEach((submission) => {
      const label = submission.submittedAt.toLocaleDateString('en-US', { weekday: 'short' });
      if (submitCounts[label] !== undefined) {
        submitCounts[label] += 1;
      }
    });

    submissions = dayLabels.map((label) => ({
      label,
      count: submitCounts[label]
    }));

    performance = gradedSubmissions
      .reverse()
      .map((submission) => ({
        label: toCompactLabel(submission.assignment.title),
        score: submission.grade
      }));
  }

  return sendSuccess(res, {
    data: {
      performance,
      submissions,
      weakStudents,
      topStudents,
      riskStudents,
      insights
    }
  });
});
