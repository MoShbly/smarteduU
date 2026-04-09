import prisma from '../lib/prisma.js';
import { ROLES } from '../constants/roles.js';
import { activityLogInclude } from '../utils/selects.js';

export const logActivity = ({ actorId, action, entityType, entityId, details = {} }) => {
  return prisma.activityLog.create({
    data: {
      actorId,
      action,
      entityType,
      entityId,
      details
    }
  });
};

const getTeacherActivityTargets = async (teacherId) => {
  const courses = await prisma.course.findMany({
    where: {
      teacherId
    },
    select: {
      id: true,
      assignments: {
        select: {
          id: true,
          submissions: {
            select: {
              id: true
            }
          }
        }
      }
    }
  });

  const courseIds = courses.map((course) => course.id);
  const assignmentIds = courses.flatMap((course) => course.assignments.map((assignment) => assignment.id));
  const submissionIds = courses.flatMap((course) =>
    course.assignments.flatMap((assignment) => assignment.submissions.map((submission) => submission.id))
  );

  return {
    courseIds,
    assignmentIds,
    submissionIds
  };
};

const getStudentActivityTargets = async (studentId) => {
  const [enrollments, submissions] = await Promise.all([
    prisma.enrollment.findMany({
      where: {
        studentId
      },
      select: {
        courseId: true,
        course: {
          select: {
            assignments: {
              select: {
                id: true
              }
            }
          }
        }
      }
    }),
    prisma.submission.findMany({
      where: {
        studentId
      },
      select: {
        id: true
      }
    })
  ]);

  const courseIds = enrollments.map((enrollment) => enrollment.courseId);
  const assignmentIds = enrollments.flatMap((enrollment) => enrollment.course.assignments.map((assignment) => assignment.id));
  const submissionIds = submissions.map((submission) => submission.id);

  return {
    courseIds,
    assignmentIds,
    submissionIds
  };
};

const buildRelevantActivityWhere = async ({ userId, role }) => {
  const targets =
    role === ROLES.TEACHER
      ? await getTeacherActivityTargets(userId)
      : await getStudentActivityTargets(userId);

  const orConditions = [{ actorId: userId }];

  if (targets.courseIds.length) {
    orConditions.push({
      entityType: 'Course',
      entityId: {
        in: targets.courseIds
      }
    });
  }

  if (targets.assignmentIds.length) {
    orConditions.push({
      entityType: 'Assignment',
      entityId: {
        in: targets.assignmentIds
      }
    });
  }

  if (targets.submissionIds.length) {
    orConditions.push({
      entityType: 'Submission',
      entityId: {
        in: targets.submissionIds
      }
    });
  }

  return {
    OR: orConditions
  };
};

export const getRelevantActivities = async ({ userId, role, take = 10 }) => {
  const where = await buildRelevantActivityWhere({ userId, role });

  return prisma.activityLog.findMany({
    where,
    include: activityLogInclude,
    orderBy: {
      createdAt: 'desc'
    },
    take
  });
};
