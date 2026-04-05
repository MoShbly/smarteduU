import prisma from '../lib/prisma.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/response.js';
import { activityLogInclude, assignmentInclude, courseInclude, submissionInclude } from '../utils/selects.js';

const buildTeacherDashboard = async (teacherId) => {
  const [totalCourses, totalAssignments, totalSubmissions, distinctStudents, courseHighlights, recentAssignments, recentSubmissions, recentActivities] =
    await Promise.all([
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
      prisma.submission.count({
        where: {
          assignment: {
            course: {
              teacherId
            }
          }
        }
      }),
      prisma.enrollment.findMany({
        where: {
          status: 'active',
          course: {
            teacherId
          }
        },
        select: {
          studentId: true
        },
        distinct: ['studentId']
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
        take: 4
      }),
      prisma.assignment.findMany({
        where: {
          course: {
            teacherId
          }
        },
        include: assignmentInclude,
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
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
        take: 5
      }),
      prisma.activityLog.findMany({
        where: {
          actorId: teacherId
        },
        include: activityLogInclude,
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      })
    ]);

  return {
    metrics: {
      totalCourses,
      totalStudents: distinctStudents.length,
      totalAssignments,
      totalSubmissions
    },
    courseHighlights,
    recentAssignments,
    recentSubmissions,
    recentActivities
  };
};

const buildStudentDashboard = async (studentId) => {
  const [enrolledCoursesCount, pendingAssignmentsCount, submittedAssignmentsCount, courses, upcomingAssignments, recentSubmissions, recentActivities] =
    await Promise.all([
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
        take: 4
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
        take: 5
      }),
      prisma.submission.findMany({
        where: {
          studentId
        },
        include: submissionInclude,
        orderBy: {
          submittedAt: 'desc'
        },
        take: 5
      }),
      prisma.activityLog.findMany({
        where: {
          actorId: studentId
        },
        include: activityLogInclude,
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      })
    ]);

  return {
    metrics: {
      enrolledCourses: enrolledCoursesCount,
      pendingAssignments: pendingAssignmentsCount,
      submittedAssignments: submittedAssignmentsCount
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
