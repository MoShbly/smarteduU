import prisma from '../lib/prisma.js';
import { logActivity } from '../services/activity-log.service.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/response.js';
import { assignmentInclude } from '../utils/selects.js';

const buildAssignmentInclude = ({ role, userId }) => ({
  ...assignmentInclude,
  ...(role === 'student'
    ? {
        submissions: {
          where: {
            studentId: userId
          },
          select: {
            id: true,
            content: true,
            status: true,
            grade: true,
            feedback: true,
            submittedAt: true,
            updatedAt: true
          }
        }
      }
    : {})
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

const getAssignmentsInternal = async ({ role, userId, courseId }) => {
  return prisma.assignment.findMany({
    where: buildAssignmentWhere({ role, userId, courseId }),
    include: buildAssignmentInclude({ role, userId }),
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }]
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
      assignments
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
      assignments
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
