import prisma from '../lib/prisma.js';
import { logActivity } from '../services/activity-log.service.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/response.js';
import { courseInclude } from '../utils/selects.js';
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
      course
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

  const enrolledCourse = await prisma.course.findUnique({
    where: {
      id: course.id
    },
    include: courseInclude
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Course joined successfully',
    data: {
      course: enrolledCourse
    }
  });
});
