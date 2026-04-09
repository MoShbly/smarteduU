import prisma from '../lib/prisma.js';
import { logActivity } from '../services/activity-log.service.js';
import {
  assignmentProgressSelect,
  buildAssignmentProgressIndex,
  buildAssignmentProgressSnapshot,
  recordAssignmentProgress,
  submissionProgressSelect
} from '../services/progress.service.js';
import { isFinalSubmissionStatus } from '../constants/progress.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/response.js';
import { submissionInclude, userSummarySelect } from '../utils/selects.js';
import { removeStoredAsset, toPublicAssetUrl, toStoredAssetPath } from '../utils/assets.js';

const teacherSubmissionWhere = (teacherId, assignmentId) => ({
  assignment: {
    course: {
      teacherId
    },
    ...(assignmentId ? { id: assignmentId } : {})
  }
});

const serializeSubmission = (req, submission) => ({
  ...submission,
  attachmentUrl: toPublicAssetUrl(req, submission.attachmentPath)
});

const serializeSubmissions = (req, submissions = []) =>
  submissions.map((submission) => serializeSubmission(req, submission));

const getStudentAssignmentContext = async (assignmentId, studentId) => {
  const assignment = await prisma.assignment.findUnique({
    where: {
      id: assignmentId
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      maxScore: true,
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
      studentId,
      status: 'active'
    },
    select: {
      id: true
    }
  });

  if (!enrollment) {
    throw new ApiError(403, 'You are not enrolled in this course');
  }

  return assignment;
};

const buildAttachmentData = ({ uploadedFile, existingSubmission }) =>
  uploadedFile
    ? {
        attachmentPath: toStoredAssetPath(uploadedFile.path),
        attachmentName: uploadedFile.originalname,
        attachmentMimeType: uploadedFile.mimetype,
        attachmentSize: uploadedFile.size
      }
    : {
        attachmentPath: existingSubmission?.attachmentPath || null,
        attachmentName: existingSubmission?.attachmentName || null,
        attachmentMimeType: existingSubmission?.attachmentMimeType || null,
        attachmentSize: existingSubmission?.attachmentSize || null
      };

const saveSubmission = async ({ req, mode }) => {
  const { assignmentId, content } = req.body;
  const normalizedContent = content?.trim() || '';
  const uploadedFile = req.file;

  if (!assignmentId) {
    throw new ApiError(400, 'Assignment is required');
  }

  const assignment = await getStudentAssignmentContext(assignmentId, req.user.id);
  const existingSubmission = await prisma.submission.findUnique({
    where: {
      assignmentId_studentId: {
        assignmentId,
        studentId: req.user.id
      }
    },
    select: {
      id: true,
      status: true,
      attachmentPath: true,
      attachmentName: true,
      attachmentMimeType: true,
      attachmentSize: true,
      submittedAt: true
    }
  });

  if (existingSubmission?.status === 'graded') {
    throw new ApiError(409, 'This assignment has already been graded');
  }

  if (!normalizedContent && !uploadedFile && !existingSubmission?.attachmentPath) {
    throw new ApiError(
      400,
      mode === 'draft'
        ? 'Assignment and either draft text or a file are required'
        : 'Assignment and either submission text or a file are required'
    );
  }

  if (mode === 'draft' && existingSubmission?.status === 'submitted') {
    throw new ApiError(409, 'This assignment is already submitted. Update it through the submit flow.');
  }

  const attachmentData = buildAttachmentData({
    uploadedFile,
    existingSubmission
  });
  const nextStatus = mode === 'draft' ? 'draft' : 'submitted';
  let submission;

  try {
    submission = existingSubmission
      ? await prisma.submission.update({
          where: {
            id: existingSubmission.id
          },
          data: {
            content: normalizedContent,
            status: nextStatus,
            submittedAt: mode === 'submitted' ? new Date() : existingSubmission.submittedAt || new Date(),
            ...attachmentData
          },
          include: submissionInclude
        })
      : await prisma.submission.create({
          data: {
            assignmentId,
            studentId: req.user.id,
            content: normalizedContent,
            status: nextStatus,
            submittedAt: new Date(),
            ...attachmentData
          },
          include: submissionInclude
        });
  } catch (error) {
    if (uploadedFile) {
      await removeStoredAsset(toStoredAssetPath(uploadedFile.path));
    }

    throw error;
  }

  if (uploadedFile && existingSubmission?.attachmentPath) {
    await removeStoredAsset(existingSubmission.attachmentPath);
  }

  const progress = await recordAssignmentProgress({
    assignmentId,
    studentId: req.user.id,
    event: mode === 'draft' ? 'draft_saved' : 'submitted'
  });

  await logActivity({
    actorId: req.user.id,
    action:
      mode === 'draft'
        ? 'submission.draft_saved'
        : existingSubmission
          ? 'submission.updated'
          : 'submission.created',
    entityType: 'Submission',
    entityId: submission.id,
    details: {
      submissionId: submission.id,
      assignmentId,
      assignmentTitle: assignment.title,
      courseId: assignment.course.id,
      courseTitle: assignment.course.title,
      courseCode: assignment.course.code,
      mode
    }
  });

  return {
    submission,
    progress,
    isExisting: Boolean(existingSubmission)
  };
};

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
      submissions: serializeSubmissions(req, submissions)
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

  const [submissions, progressRecords, enrollments] = await Promise.all([
    prisma.submission.findMany({
      where: {
        assignmentId
      },
      include: submissionInclude,
      orderBy: {
        submittedAt: 'desc'
      }
    }),
    prisma.assignmentProgress.findMany({
      where: {
        assignmentId
      },
      select: assignmentProgressSelect
    }),
    prisma.enrollment.findMany({
      where: {
        courseId: assignment.course.id,
        status: 'active'
      },
      orderBy: {
        enrolledAt: 'desc'
      },
      select: {
        id: true,
        studentId: true,
        enrolledAt: true,
        student: {
          select: userSummarySelect
        }
      }
    })
  ]);

  const serializedSubmissions = serializeSubmissions(req, submissions);
  const { progressMap, submissionMap } = buildAssignmentProgressIndex(
    progressRecords,
    serializedSubmissions.map((submission) => ({
      ...submission,
      assignmentId,
      studentId: submission.student.id
    }))
  );
  const now = new Date();
  const studentProgress = enrollments
    .map((enrollment) => {
      const submission = submissionMap.get(`${assignmentId}:${enrollment.studentId}`) || null;
      const progress = buildAssignmentProgressSnapshot(
        progressMap.get(`${assignmentId}:${enrollment.studentId}`),
        submission
      );
      const submittedAt = submission?.submittedAt || progress.submittedAt;
      const isCompleted = progress.progressPercent >= 100 || isFinalSubmissionStatus(submission?.status);
      const isLate =
        assignment.dueDate &&
        ((isCompleted && submittedAt && submittedAt > assignment.dueDate) ||
          (!isCompleted && assignment.dueDate < now));

      return {
        id: enrollment.id,
        student: enrollment.student,
        enrolledAt: enrollment.enrolledAt,
        progress,
        submission,
        isCompleted,
        isLate
      };
    })
    .sort((left, right) => {
      if (left.isLate !== right.isLate) {
        return left.isLate ? -1 : 1;
      }

      if (left.progress.progressPercent !== right.progress.progressPercent) {
        return left.progress.progressPercent - right.progress.progressPercent;
      }

      return left.student.name.localeCompare(right.student.name);
    });

  return sendSuccess(res, {
    data: {
      assignment,
      submissions: serializedSubmissions,
      studentProgress
    }
  });
});

export const createSubmission = catchAsync(async (req, res) => {
  const { submission, progress, isExisting } = await saveSubmission({
    req,
    mode: 'submitted'
  });

  return sendSuccess(res, {
    statusCode: isExisting ? 200 : 201,
    message: isExisting ? 'Submission updated successfully' : 'Submission created successfully',
    data: {
      submission: serializeSubmission(req, submission),
      progress
    }
  });
});

export const saveSubmissionDraft = catchAsync(async (req, res) => {
  const { submission, progress } = await saveSubmission({
    req,
    mode: 'draft'
  });

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Draft saved successfully',
    data: {
      submission: serializeSubmission(req, submission),
      progress
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

  const progress = await recordAssignmentProgress({
    assignmentId: existingSubmission.assignment.id,
    studentId: existingSubmission.student.id,
    event: 'reviewed'
  });

  await logActivity({
    actorId: req.user.id,
    action: 'submission.reviewed',
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
      submission: serializeSubmission(req, submission),
      progress
    }
  });
});
