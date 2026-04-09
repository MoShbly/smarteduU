import prisma from '../lib/prisma.js';
import {
  ASSIGNMENT_PROGRESS_ORDER,
  ASSIGNMENT_PROGRESS_PERCENTAGES,
  ASSIGNMENT_PROGRESS_STATES,
  PROGRESS_EVENT_STATE_MAP,
  getAssignmentProgressPercent,
  getAssignmentProgressRank,
  isFinalSubmissionStatus,
  progressStateFromSubmissionStatus
} from '../constants/progress.js';

const progressTimelineFields = {
  viewed: 'viewedAt',
  started: 'startedAt',
  draft_saved: 'draftSavedAt',
  submitted: 'submittedAt',
  reviewed: 'reviewedAt'
};

const defaultProgressSnapshot = {
  state: ASSIGNMENT_PROGRESS_STATES.NOT_STARTED,
  progressPercent: 0,
  viewedAt: null,
  startedAt: null,
  draftSavedAt: null,
  submittedAt: null,
  reviewedAt: null,
  lastInteractionAt: null,
  hasInteraction: false
};

export const assignmentProgressSelect = {
  id: true,
  assignmentId: true,
  studentId: true,
  state: true,
  progressPercent: true,
  viewedAt: true,
  startedAt: true,
  draftSavedAt: true,
  submittedAt: true,
  reviewedAt: true,
  lastInteractionAt: true,
  createdAt: true,
  updatedAt: true
};

export const submissionProgressSelect = {
  id: true,
  assignmentId: true,
  studentId: true,
  content: true,
  status: true,
  grade: true,
  feedback: true,
  submittedAt: true,
  createdAt: true,
  updatedAt: true,
  attachmentPath: true,
  attachmentName: true,
  attachmentMimeType: true,
  attachmentSize: true
};

const getHigherProgressState = (currentState, nextState) => {
  const currentRank = getAssignmentProgressRank(currentState);
  const nextRank = getAssignmentProgressRank(nextState);

  if (nextRank === -1) {
    return currentState || ASSIGNMENT_PROGRESS_STATES.NOT_STARTED;
  }

  if (currentRank === -1) {
    return nextState;
  }

  return nextRank > currentRank ? nextState : currentState;
};

const buildProgressTimestampPatch = ({ event, currentState, nextState, now }) => {
  const patch = {};
  const currentRank = getAssignmentProgressRank(currentState);

  ASSIGNMENT_PROGRESS_ORDER.forEach((state) => {
    const field = progressTimelineFields[state];
    const stateRank = getAssignmentProgressRank(state);

    if (!field) {
      return;
    }

    if (event === state) {
      patch[field] = now;
      return;
    }

    if (stateRank !== -1 && stateRank <= currentRank) {
      return;
    }

    if (state === nextState && stateRank > currentRank) {
      patch[field] = now;
    }
  });

  return patch;
};

export const buildAssignmentProgressSnapshot = (progressRecord = null, submission = null) => {
  if (!progressRecord && !submission) {
    return {
      ...defaultProgressSnapshot
    };
  }

  const derivedState =
    progressRecord?.state ||
    progressStateFromSubmissionStatus(submission?.status) ||
    ASSIGNMENT_PROGRESS_STATES.NOT_STARTED;
  const progressPercent =
    progressRecord?.progressPercent ??
    ASSIGNMENT_PROGRESS_PERCENTAGES[derivedState] ??
    defaultProgressSnapshot.progressPercent;

  return {
    state: derivedState,
    progressPercent,
    viewedAt: progressRecord?.viewedAt || null,
    startedAt: progressRecord?.startedAt || null,
    draftSavedAt: progressRecord?.draftSavedAt || null,
    submittedAt: progressRecord?.submittedAt || submission?.submittedAt || null,
    reviewedAt:
      progressRecord?.reviewedAt ||
      (submission?.status === 'graded' ? submission?.updatedAt || submission?.submittedAt : null),
    lastInteractionAt:
      progressRecord?.lastInteractionAt ||
      progressRecord?.updatedAt ||
      submission?.updatedAt ||
      submission?.submittedAt ||
      submission?.createdAt ||
      null,
    hasInteraction: progressPercent > 0 || Boolean(submission)
  };
};

export const recordAssignmentProgress = async ({ assignmentId, studentId, event, tx = prisma }) => {
  const normalizedEvent = String(event || '').toLowerCase();
  const targetState = PROGRESS_EVENT_STATE_MAP[normalizedEvent];

  if (!targetState) {
    throw new Error(`Unsupported progress event: ${event}`);
  }

  const now = new Date();
  const existingProgress = await tx.assignmentProgress.findUnique({
    where: {
      assignmentId_studentId: {
        assignmentId,
        studentId
      }
    },
    select: assignmentProgressSelect
  });

  const currentState = existingProgress?.state || ASSIGNMENT_PROGRESS_STATES.NOT_STARTED;
  const nextState = getHigherProgressState(currentState, targetState);
  const progressPercent = getAssignmentProgressPercent(nextState);
  const timelinePatch = buildProgressTimestampPatch({
    event: normalizedEvent,
    currentState,
    nextState,
    now
  });

  if (existingProgress) {
    return tx.assignmentProgress.update({
      where: {
        id: existingProgress.id
      },
      data: {
        state: nextState,
        progressPercent,
        lastInteractionAt: now,
        ...timelinePatch
      },
      select: assignmentProgressSelect
    });
  }

  return tx.assignmentProgress.create({
    data: {
      assignmentId,
      studentId,
      state: nextState,
      progressPercent,
      lastInteractionAt: now,
      ...timelinePatch
    },
    select: assignmentProgressSelect
  });
};

export const buildAssignmentProgressIndex = (progressRecords = [], submissions = []) => {
  const progressMap = new Map();
  const submissionMap = new Map();

  progressRecords.forEach((progressRecord) => {
    progressMap.set(`${progressRecord.assignmentId}:${progressRecord.studentId}`, progressRecord);
  });

  submissions.forEach((submission) => {
    submissionMap.set(`${submission.assignmentId}:${submission.studentId}`, submission);
  });

  return {
    progressMap,
    submissionMap
  };
};

export const getIndexedAssignmentProgress = ({
  assignmentId,
  studentId,
  progressMap,
  submissionMap
}) =>
  buildAssignmentProgressSnapshot(
    progressMap.get(`${assignmentId}:${studentId}`),
    submissionMap.get(`${assignmentId}:${studentId}`)
  );

export const calculateCourseProgress = ({
  assignmentIds = [],
  studentId,
  progressMap,
  submissionMap
}) => {
  if (!assignmentIds.length) {
    return {
      progressPercent: null,
      completionRate: null,
      totalAssignments: 0,
      completedAssignments: 0,
      pendingAssignments: 0,
      startedAssignments: 0,
      draftAssignments: 0
    };
  }

  const snapshots = assignmentIds.map((assignmentId) =>
    getIndexedAssignmentProgress({
      assignmentId,
      studentId,
      progressMap,
      submissionMap
    })
  );

  const totalProgress = snapshots.reduce((sum, snapshot) => sum + snapshot.progressPercent, 0);
  const completedAssignments = snapshots.filter((snapshot) => snapshot.progressPercent >= 100).length;
  const startedAssignments = snapshots.filter((snapshot) => snapshot.progressPercent > 0).length;
  const draftAssignments = snapshots.filter(
    (snapshot) => snapshot.state === ASSIGNMENT_PROGRESS_STATES.DRAFT_SAVED
  ).length;
  const progressPercent = Math.round(totalProgress / assignmentIds.length);
  const completionRate = Math.round((completedAssignments / assignmentIds.length) * 100);

  return {
    progressPercent,
    completionRate,
    totalAssignments: assignmentIds.length,
    completedAssignments,
    pendingAssignments: assignmentIds.length - completedAssignments,
    startedAssignments,
    draftAssignments
  };
};

export const calculateAssignmentProgressSummary = ({
  assignment,
  studentIds = [],
  progressMap,
  submissionMap,
  now = new Date()
}) => {
  if (!studentIds.length) {
    return {
      totalStudents: 0,
      averageProgressPercent: null,
      completionRate: null,
      submittedCount: 0,
      draftCount: 0,
      startedCount: 0,
      notStartedCount: 0,
      delayedCount: 0
    };
  }

  const snapshots = studentIds.map((studentId) => {
    const progress = getIndexedAssignmentProgress({
      assignmentId: assignment.id,
      studentId,
      progressMap,
      submissionMap
    });
    const submission = submissionMap.get(`${assignment.id}:${studentId}`) || null;
    const submittedAt = submission?.submittedAt || progress.submittedAt;
    const isSubmitted = progress.progressPercent >= 100 || isFinalSubmissionStatus(submission?.status);
    const isLate =
      assignment.dueDate &&
      ((isSubmitted && submittedAt && submittedAt > assignment.dueDate) ||
        (!isSubmitted && assignment.dueDate < now));

    return {
      studentId,
      progress,
      submission,
      isSubmitted,
      isLate
    };
  });

  const totalProgress = snapshots.reduce((sum, snapshot) => sum + snapshot.progress.progressPercent, 0);
  const submittedCount = snapshots.filter((snapshot) => snapshot.isSubmitted).length;
  const draftCount = snapshots.filter(
    (snapshot) => snapshot.progress.state === ASSIGNMENT_PROGRESS_STATES.DRAFT_SAVED
  ).length;
  const startedCount = snapshots.filter((snapshot) => snapshot.progress.progressPercent > 0).length;
  const delayedCount = snapshots.filter((snapshot) => snapshot.isLate).length;

  return {
    totalStudents: studentIds.length,
    averageProgressPercent: Math.round(totalProgress / studentIds.length),
    completionRate: Math.round((submittedCount / studentIds.length) * 100),
    submittedCount,
    draftCount,
    startedCount,
    notStartedCount: studentIds.length - startedCount,
    delayedCount
  };
};
