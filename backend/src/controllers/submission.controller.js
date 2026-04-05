import prisma from '../lib/prisma.js';
import { logActivity } from '../services/activity-log.service.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/response.js';
import { submissionInclude } from '../utils/selects.js';

export const getSubmissions = catchAsync(async (req, res) => {
  const submissions = await prisma.submission.findMany({
    where:
      req.user.role === 'teacher'
        ? {
            assignment: {
              course: {
                teacherId: req.user.id
              }
            }
          }
        : {
            studentId: req.user.id
          },
    include: submissionInclude,
    orderBy: {
      submittedAt: 'desc'
    }
  });

  return sendSuccess(res, {
    data: {
      submissions
    }
  });
});

export const createSubmission = catchAsync(async (req, res) => {
  const { assignmentId, content } = req.body;

  if (!assignmentId || !content) {
    throw new ApiError(400, 'Assignment and content are required');
  }

  if (!content.trim()) {
    throw new ApiError(400, 'Submission content cannot be empty');
  }

  const assignment = await prisma.assignment.findUnique({
    where: {
      id: assignmentId
    },
    select: {
      id: true,
      courseId: true
    }
  });

  if (!assignment) {
    throw new ApiError(404, 'Assignment not found');
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      courseId: assignment.courseId,
      studentId: req.user.id,
      status: 'active'
    },
    select: {
      id: true
    }
  });

  if (!enrollment) {
    throw new ApiError(403, 'You are not enrolled in this course');
  }

  const submission = await prisma.submission.create({
    data: {
      assignmentId,
      studentId: req.user.id,
      content: content.trim()
    },
    include: submissionInclude
  });

  await logActivity({
    actorId: req.user.id,
    action: 'submission.created',
    entityType: 'Submission',
    entityId: submission.id,
    details: {
      assignmentId
    }
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Submission created successfully',
    data: {
      submission
    }
  });
});
