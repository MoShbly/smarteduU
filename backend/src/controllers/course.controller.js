import prisma from '../lib/prisma.js';
import { logActivity } from '../services/activity-log.service.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/response.js';
import { courseInclude } from '../utils/selects.js';

export const getCourses = catchAsync(async (req, res) => {
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

  const courses = await prisma.course.findMany({
    where,
    include: courseInclude,
    orderBy: {
      createdAt: 'desc'
    }
  });

  return sendSuccess(res, {
    data: {
      courses
    }
  });
});

export const createCourse = catchAsync(async (req, res) => {
  const { title, description, subject, code } = req.body;

  if (!title || !code) {
    throw new ApiError(400, 'Title and code are required');
  }

  const course = await prisma.course.create({
    data: {
      title: title.trim(),
      description: description?.trim() || '',
      subject: subject?.trim() || '',
      code: code.trim().toUpperCase(),
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
      code: course.code
    }
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Course created successfully',
    data: {
      course
    }
  });
});
