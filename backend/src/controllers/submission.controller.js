import prisma from '../lib/prisma.js';
import { logActivity } from '../services/activity-log.service.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/response.js';
import { submissionInclude } from '../utils/selects.js';

const teacherSubmissionWhere = (teacherId, assignmentId) => ({
  assignment: {
    course: {
      teacherId
    },
    ...(assignmentId ? { id: assignmentId } : {})
  }
});

export const getSubmissions = catchAsync(async (req, res) => {
  const assignmentId = req.query.assignmentId;

  const submissions = await prisma.submission.findMany({
    where:
      req.user.role === 'teacher'
        ? teacherSubmissionWhere(req.user.id, assignmentId)
        : {
            studentId: req.user.id,
            ...(assignmentId ? { assignmentId } : {})
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

export const getSubmissionsByAssignment = catchAsync(async (req, res) => {
  const { id: assignmentId } = req.params;

  const assignment = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      course: {
        teacherId: req.user.id
      }
    },
    select: {
      id: true,
      title: true,
      maxScore: true,
      dueDate: true,
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
    throw new ApiError(404, 'Assignment not found or not owned by this teacher');
  }

  const submissions = await prisma.submission.findMany({
    where: {
      assignmentId
    },
    include: submissionInclude,
    orderBy: {
      submittedAt: 'desc'
    }
  });

  return sendSuccess(res, {
    data: {
      assignment,
      submissions
    }
  });
});

export const createSubmission = catchAsync(async (req, res) => {
  const { assignmentId, content } = req.body;

  if (!assignmentId || !content?.trim()) {
    throw new ApiError(400, 'Assignment and content are required');
  }

  const assignment = await prisma.assignment.findUnique({
    where: {
      id: assignmentId
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

  const existingSubmission = await prisma.submission.findUnique({
    where: {
      assignmentId_studentId: {
        assignmentId,
        studentId: req.user.id
      }
    },
    select: {
      id: true,
      status: true
    }
  });

  if (existingSubmission?.status === 'graded') {
    throw new ApiError(409, 'This assignment has already been graded');
  }

  const submission = existingSubmission
    ? await prisma.submission.update({
        where: {
          id: existingSubmission.id
        },
        data: {
          content: content.trim(),
          status: 'submitted',
          submittedAt: new Date()
        },
        include: submissionInclude
      })
    : await prisma.submission.create({
        data: {
          assignmentId,
          studentId: req.user.id,
          content: content.trim(),
          status: 'submitted',
          submittedAt: new Date()
        },
        include: submissionInclude
      });

  await logActivity({
    actorId: req.user.id,
    action: existingSubmission ? 'submission.resubmitted' : 'submission.created',
    entityType: 'Submission',
    entityId: submission.id,
    details: {
      submissionId: submission.id,
      assignmentId,
      assignmentTitle: assignment.title,
      courseId: assignment.course.id,
      courseTitle: assignment.course.title,
      courseCode: assignment.course.code
    }
  });

  return sendSuccess(res, {
    statusCode: existingSubmission ? 200 : 201,
    message: existingSubmission ? 'Submission updated successfully' : 'Submission created successfully',
    data: {
      submission
    }
  });
});

export const reviewSubmission = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { grade, feedback } = req.body;

  const existingSubmission = await prisma.submission.findFirst({
    where: {
      id,
      assignment: {
        course: {
          teacherId: req.user.id
        }
      }
    },
    include: {
      assignment: {
        select: {
          id: true,
          title: true,
          maxScore: true,
          course: {
            select: {
              id: true,
              title: true,
              code: true
            }
          }
        }
      },
      student: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!existingSubmission) {
    throw new ApiError(404, 'Submission not found or not accessible');
  }

  const normalizedGrade =
    grade === undefined || grade === null || grade === ''
      ? null
      : Number(grade);

  if (normalizedGrade !== null) {
    if (Number.isNaN(normalizedGrade) || normalizedGrade < 0) {
      throw new ApiError(400, 'Grade must be a valid number greater than or equal to zero');
    }

    if (normalizedGrade > existingSubmission.assignment.maxScore) {
      throw new ApiError(400, 'Grade cannot exceed the assignment max score');
    }
  }

  const submission = await prisma.submission.update({
    where: {
      id
    },
    data: {
      status: 'graded',
      grade: normalizedGrade,
      feedback: feedback?.trim() || ''
    },
    include: submissionInclude
  });

  await logActivity({
    actorId: req.user.id,
    action: 'submission.graded',
    entityType: 'Submission',
    entityId: submission.id,
    details: {
      submissionId: submission.id,
      assignmentId: existingSubmission.assignment.id,
      assignmentTitle: existingSubmission.assignment.title,
      courseId: existingSubmission.assignment.course.id,
      courseTitle: existingSubmission.assignment.course.title,
      courseCode: existingSubmission.assignment.course.code,
      studentId: existingSubmission.student.id,
      studentName: existingSubmission.student.name,
      grade: normalizedGrade
    }
  });

  return sendSuccess(res, {
    message: 'Submission graded successfully',
    data: {
      submission
    }
  });
});
