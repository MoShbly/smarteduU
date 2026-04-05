import prisma from '../lib/prisma.js';
import { logActivity } from '../services/activity-log.service.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/response.js';
import { assignmentInclude } from '../utils/selects.js';

export const getAssignments = catchAsync(async (req, res) => {
  const courseId = req.query.courseId;

  const where =
    req.user.role === 'teacher'
      ? {
          createdById: req.user.id,
          ...(courseId ? { courseId } : {})
        }
      : {
          ...(courseId ? { courseId } : {}),
          course: {
            enrollments: {
              some: {
                studentId: req.user.id,
                status: 'active'
              }
            }
          }
        };

  const assignments = await prisma.assignment.findMany({
    where,
    include: assignmentInclude,
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }]
  });

  return sendSuccess(res, {
    data: {
      assignments
    }
  });
});

export const createAssignment = catchAsync(async (req, res) => {
  const { courseId, title, description, dueDate, maxScore } = req.body;

  if (!courseId || !title || !dueDate) {
    throw new ApiError(400, 'Course, title, and due date are required');
  }

  const parsedDueDate = new Date(dueDate);

  if (Number.isNaN(parsedDueDate.getTime())) {
    throw new ApiError(400, 'Due date must be a valid date');
  }

  if (maxScore && Number(maxScore) <= 0) {
    throw new ApiError(400, 'Max score must be greater than zero');
  }

  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      teacherId: req.user.id
    },
    select: {
      id: true
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
      maxScore: maxScore ? Number(maxScore) : 100,
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
      title: assignment.title,
      courseId
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
