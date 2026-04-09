import prisma from '../lib/prisma.js';
import { logActivity } from '../services/activity-log.service.js';
import {
  assignmentProgressSelect,
  buildAssignmentProgressSnapshot,
  buildAssignmentProgressIndex,
  calculateAssignmentProgressSummary,
  recordAssignmentProgress,
  submissionProgressSelect
} from '../services/progress.service.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/response.js';
import { assignmentInclude } from '../utils/selects.js';
import { toPublicAssetUrl } from '../utils/assets.js';

const buildAssignmentInclude = ({ role, userId }) => ({
  ...assignmentInclude,
  progressRecords:
    role === 'student'
      ? {
          where: {
            studentId: userId
          },
          select: assignmentProgressSelect
        }
      : {
          select: assignmentProgressSelect
        },
  submissions:
    role === 'student'
      ? {
          where: {
            studentId: userId
          },
          select: submissionProgressSelect
        }
      : {
          select: submissionProgressSelect
        }
});

const buildAssignmentWhere = ({ role, userId, courseId }) =>
  role === 'teacher'
    ? {
        createdById: userId,
        ...(courseId ? { courseId } : {})
      }
    : {
        ...(courseId ? { courseId } : {}),
        course: {
          enrollments: {
            some: {
              studentId: userId,
              status: 'active'
            }
          }
        }
      };

const getAssignmentsInternal = async ({ role, userId, courseId }) =>
  prisma.assignment.findMany({
    where: buildAssignmentWhere({ role, userId, courseId }),
    include: buildAssignmentInclude({ role, userId }),
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }]
  });

const serializeStudentAssignments = (req, assignments = []) =>
  assignments.map((assignment) => {
    const submission = assignment.submissions?.[0]
      ? {
          ...assignment.submissions[0],
          attachmentUrl: toPublicAssetUrl(req, assignment.submissions[0].attachmentPath)
        }
      : null;

    return {
      ...assignment,
      progress: buildAssignmentProgressSnapshot(assignment.progressRecords?.[0], submission),
      submissions: submission ? [submission] : [],
      progressRecords: undefined
    };
  });

const serializeTeacherAssignments = async (assignments = []) => {
  if (!assignments.length) {
    return assignments;
  }

  const courseIds = Array.from(new Set(assignments.map((assignment) => assignment.courseId)));
  const enrollments = await prisma.enrollment.findMany({
    where: {
      courseId: {
        in: courseIds
      },
      status: 'active'
    },
    select: {
      courseId: true,
      studentId: true
    }
  });
  const studentIdsByCourse = enrollments.reduce((map, enrollment) => {
    if (!map.has(enrollment.courseId)) {
      map.set(enrollment.courseId, []);
    }

    map.get(enrollment.courseId).push(enrollment.studentId);
    return map;
  }, new Map());
  const progressRecords = assignments.flatMap((assignment) => assignment.progressRecords || []);
  const submissions = assignments.flatMap((assignment) => assignment.submissions || []);
  const { progressMap, submissionMap } = buildAssignmentProgressIndex(progressRecords, submissions);

  return assignments.map((assignment) => ({
    ...assignment,
    progressSummary: calculateAssignmentProgressSummary({
      assignment,
      studentIds: studentIdsByCourse.get(assignment.courseId) || [],
      progressMap,
      submissionMap
    }),
    progressRecords: undefined,
    submissions: undefined
  }));
};

const serializeAssignments = async (req, assignments = [], role) =>
  role === 'student'
    ? serializeStudentAssignments(req, assignments)
    : serializeTeacherAssignments(assignments);

const getStudentAssignmentContext = async (assignmentId, studentId) => {
  const assignment = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      course: {
        isArchived: false,
        enrollments: {
          some: {
            studentId,
            status: 'active'
          }
        }
      }
    },
    select: {
      id: true,
      title: true,
      courseId: true,
      course: {
        select: {
          id: true,
          title: true,
          code: true
        }
      }
    }
  });

  if (!assignment) {
    throw new ApiError(404, 'Assignment not found or not available to this student');
  }

  return assignment;
};

const trackAssignmentEvent = async ({ req, res, event, action, message }) => {
  const assignment = await getStudentAssignmentContext(req.params.id, req.user.id);
  const progress = await recordAssignmentProgress({
    assignmentId: assignment.id,
    studentId: req.user.id,
    event
  });

  await logActivity({
    actorId: req.user.id,
    action,
    entityType: 'Assignment',
    entityId: assignment.id,
    details: {
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
      courseId: assignment.course.id,
      courseTitle: assignment.course.title,
      courseCode: assignment.course.code
    }
  });

  return sendSuccess(res, {
    message,
    data: {
      progress
    }
  });
};

export const getAssignments = catchAsync(async (req, res) => {
  const assignments = await getAssignmentsInternal({
    role: req.user.role,
    userId: req.user.id,
    courseId: req.query.courseId
  });

  return sendSuccess(res, {
    data: {
      assignments: await serializeAssignments(req, assignments, req.user.role)
    }
  });
});

export const getAssignmentsByCourse = catchAsync(async (req, res) => {
  const { id: courseId } = req.params;

  if (!courseId) {
    throw new ApiError(400, 'Course id is required');
  }

  const assignments = await getAssignmentsInternal({
    role: req.user.role,
    userId: req.user.id,
    courseId
  });

  return sendSuccess(res, {
    data: {
      assignments: await serializeAssignments(req, assignments, req.user.role)
    }
  });
});

export const createAssignment = catchAsync(async (req, res) => {
  const { courseId, title, description, dueDate, maxScore } = req.body;

  if (!courseId || !title?.trim() || !dueDate) {
    throw new ApiError(400, 'Course, title, and due date are required');
  }

  const parsedDueDate = new Date(dueDate);
  if (Number.isNaN(parsedDueDate.getTime())) {
    throw new ApiError(400, 'Due date must be a valid date');
  }

  const normalizedMaxScore = maxScore ? Number(maxScore) : 100;
  if (Number.isNaN(normalizedMaxScore) || normalizedMaxScore <= 0) {
    throw new ApiError(400, 'Max score must be greater than zero');
  }

  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      teacherId: req.user.id,
      isArchived: false
    },
    select: {
      id: true,
      title: true,
      code: true
    }
  });

  if (!course) {
    throw new ApiError(404, 'Course not found or not owned by this teacher');
  }

  const assignment = await prisma.assignment.create({
    data: {
      courseId,
      title: title.trim(),
      description: description?.trim() || '',
      dueDate: parsedDueDate,
      maxScore: normalizedMaxScore,
      createdById: req.user.id
    },
    include: assignmentInclude
  });

  await logActivity({
    actorId: req.user.id,
    action: 'assignment.created',
    entityType: 'Assignment',
    entityId: assignment.id,
    details: {
      assignmentId: assignment.id,
      courseId: course.id,
      title: assignment.title,
      courseTitle: course.title,
      courseCode: course.code
    }
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Assignment created successfully',
    data: {
      assignment
    }
  });
});

export const trackAssignmentView = catchAsync(async (req, res) =>
  trackAssignmentEvent({
    req,
    res,
    event: 'viewed',
    action: 'assignment.viewed',
    message: 'Assignment view tracked'
  })
);

export const trackAssignmentStart = catchAsync(async (req, res) =>
  trackAssignmentEvent({
    req,
    res,
    event: 'started',
    action: 'assignment.started',
    message: 'Assignment start tracked'
  })
);
