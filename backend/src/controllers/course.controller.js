import prisma from '../lib/prisma.js';
import { logActivity } from '../services/activity-log.service.js';
import {
  buildAssignmentProgressIndex,
  calculateCourseProgress,
  submissionProgressSelect,
  assignmentProgressSelect
} from '../services/progress.service.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/response.js';
import { courseInclude, userSummarySelect } from '../utils/selects.js';
import { buildCourseCodeCandidate } from '../utils/course-code.js';

const generateCourseCode = async ({ title, subject }) => {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = buildCourseCodeCandidate({ title, subject });
    const existingCourse = await prisma.course.findUnique({
      where: {
        code
      },
      select: {
        id: true
      }
    });

    if (!existingCourse) {
      return code;
    }
  }

  throw new ApiError(500, 'Unable to generate a unique course code');
};

const attachCourseProgress = async ({ courses, role, userId }) => {
  if (!courses.length) {
    return courses;
  }

  const courseIds = courses.map((course) => course.id);
  const assignments = await prisma.assignment.findMany({
    where: {
      courseId: {
        in: courseIds
      }
    },
    select: {
      id: true,
      courseId: true
    }
  });

  const assignmentIds = assignments.map((assignment) => assignment.id);

  if (!assignmentIds.length) {
    return courses.map((course) => ({
      ...course,
      courseProgress: {
        progressPercent: null,
        completionRate: null,
        totalAssignments: 0,
        completedAssignments: 0,
        pendingAssignments: 0,
        startedAssignments: 0,
        draftAssignments: 0
      },
      ...(role === 'teacher'
        ? {
            enrollments: (course.enrollments || []).map((enrollment) => ({
              ...enrollment,
              courseProgress: {
                progressPercent: null,
                completionRate: null,
                totalAssignments: 0,
                completedAssignments: 0,
                pendingAssignments: 0,
                startedAssignments: 0,
                draftAssignments: 0
              }
            }))
          }
        : {})
    }));
  }

  const relevantStudentIds =
    role === 'teacher'
      ? Array.from(
          new Set(
            courses.flatMap((course) =>
              (course.enrollments || []).map((enrollment) => enrollment.student.id)
            )
          )
        )
      : [userId];

  const [progressRecords, submissions] = await Promise.all([
    prisma.assignmentProgress.findMany({
      where: {
        assignmentId: {
          in: assignmentIds
        },
        studentId: {
          in: relevantStudentIds
        }
      },
      select: assignmentProgressSelect
    }),
    prisma.submission.findMany({
      where: {
        assignmentId: {
          in: assignmentIds
        },
        studentId: {
          in: relevantStudentIds
        }
      },
      select: submissionProgressSelect
    })
  ]);

  const { progressMap, submissionMap } = buildAssignmentProgressIndex(progressRecords, submissions);
  const assignmentIdsByCourse = assignments.reduce((map, assignment) => {
    if (!map.has(assignment.courseId)) {
      map.set(assignment.courseId, []);
    }

    map.get(assignment.courseId).push(assignment.id);
    return map;
  }, new Map());

  return courses.map((course) => {
    const courseAssignmentIds = assignmentIdsByCourse.get(course.id) || [];

    if (role === 'teacher') {
      const studentProgress = (course.enrollments || []).map((enrollment) => {
        const courseProgress = calculateCourseProgress({
          assignmentIds: courseAssignmentIds,
          studentId: enrollment.student.id,
          progressMap,
          submissionMap
        });

        return {
          ...enrollment,
          courseProgress
        };
      });
      const progressValues = studentProgress
        .map((enrollment) => enrollment.courseProgress.progressPercent)
        .filter((value) => value !== null);
      const completionValues = studentProgress
        .map((enrollment) => enrollment.courseProgress.completionRate)
        .filter((value) => value !== null);

      return {
        ...course,
        enrollments: studentProgress,
        courseProgress: {
          progressPercent: progressValues.length
            ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length)
            : null,
          completionRate: completionValues.length
            ? Math.round(completionValues.reduce((sum, value) => sum + value, 0) / completionValues.length)
            : null,
          totalAssignments: courseAssignmentIds.length,
          studentsCount: course.enrollments?.length || 0
        }
      };
    }

    return {
      ...course,
      courseProgress: calculateCourseProgress({
        assignmentIds: courseAssignmentIds,
        studentId: userId,
        progressMap,
        submissionMap
      })
    };
  });
};

export const getCourses = catchAsync(async (req, res) => {
  const include =
    req.user.role === 'teacher'
      ? {
          ...courseInclude,
          enrollments: {
            where: {
              status: 'active'
            },
            orderBy: {
              enrolledAt: 'desc'
            },
            select: {
              id: true,
              enrolledAt: true,
              student: {
                select: userSummarySelect
              }
            }
          }
        }
      : courseInclude;

  const where =
    req.user.role === 'teacher'
      ? {
          teacherId: req.user.id,
          isArchived: false
        }
      : {
          isArchived: false,
          enrollments: {
            some: {
              studentId: req.user.id,
              status: 'active'
            }
          }
        };

  const rawCourses = await prisma.course.findMany({
    where,
    include,
    orderBy: {
      createdAt: 'desc'
    }
  });

  const courses = await attachCourseProgress({
    courses: rawCourses,
    role: req.user.role,
    userId: req.user.id
  });

  return sendSuccess(res, {
    data: {
      courses
    }
  });
});

export const createCourse = catchAsync(async (req, res) => {
  const { title, description, subject } = req.body;

  if (!title?.trim()) {
    throw new ApiError(400, 'Course title is required');
  }

  const code = await generateCourseCode({
    title: title.trim(),
    subject: subject?.trim() || ''
  });

  const course = await prisma.course.create({
    data: {
      title: title.trim(),
      description: description?.trim() || '',
      subject: subject?.trim() || '',
      code,
      teacherId: req.user.id
    },
    include: courseInclude
  });

  await logActivity({
    actorId: req.user.id,
    action: 'course.created',
    entityType: 'Course',
    entityId: course.id,
    details: {
      title: course.title,
      code: course.code,
      subject: course.subject
    }
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Course created successfully',
    data: {
      course: {
        ...course,
        courseProgress: {
          progressPercent: null,
          completionRate: null,
          totalAssignments: 0,
          completedAssignments: 0,
          pendingAssignments: 0,
          startedAssignments: 0,
          draftAssignments: 0
        }
      }
    }
  });
});

export const joinCourse = catchAsync(async (req, res) => {
  const { code } = req.body;

  if (!code?.trim()) {
    throw new ApiError(400, 'Course code is required');
  }

  const normalizedCode = code.trim().toUpperCase();
  const course = await prisma.course.findUnique({
    where: {
      code: normalizedCode
    },
    include: courseInclude
  });

  if (!course || course.isArchived) {
    throw new ApiError(404, 'Course not found for the provided code');
  }

  const existingEnrollment = await prisma.enrollment.findFirst({
    where: {
      courseId: course.id,
      studentId: req.user.id
    },
    select: {
      id: true,
      status: true
    }
  });

  if (existingEnrollment) {
    throw new ApiError(409, 'You are already enrolled in this course');
  }

  await prisma.enrollment.create({
    data: {
      courseId: course.id,
      studentId: req.user.id,
      status: 'active'
    }
  });

  await logActivity({
    actorId: req.user.id,
    action: 'course.joined',
    entityType: 'Course',
    entityId: course.id,
    details: {
      courseId: course.id,
      title: course.title,
      code: course.code
    }
  });

  const [enrolledCourse] = await attachCourseProgress({
    courses: [
      await prisma.course.findUnique({
        where: {
          id: course.id
        },
        include: courseInclude
      })
    ],
    role: req.user.role,
    userId: req.user.id
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Course joined successfully',
    data: {
      course: enrolledCourse
    }
  });
});
