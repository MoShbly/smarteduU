export const ASSIGNMENT_PROGRESS_STATES = {
  NOT_STARTED: 'not_started',
  VIEWED: 'viewed',
  STARTED: 'started',
  DRAFT_SAVED: 'draft_saved',
  SUBMITTED: 'submitted',
  REVIEWED: 'reviewed'
};

export const ASSIGNMENT_PROGRESS_ORDER = [
  ASSIGNMENT_PROGRESS_STATES.NOT_STARTED,
  ASSIGNMENT_PROGRESS_STATES.VIEWED,
  ASSIGNMENT_PROGRESS_STATES.STARTED,
  ASSIGNMENT_PROGRESS_STATES.DRAFT_SAVED,
  ASSIGNMENT_PROGRESS_STATES.SUBMITTED,
  ASSIGNMENT_PROGRESS_STATES.REVIEWED
];

export const ASSIGNMENT_PROGRESS_PERCENTAGES = {
  [ASSIGNMENT_PROGRESS_STATES.NOT_STARTED]: 0,
  [ASSIGNMENT_PROGRESS_STATES.VIEWED]: 20,
  [ASSIGNMENT_PROGRESS_STATES.STARTED]: 50,
  [ASSIGNMENT_PROGRESS_STATES.DRAFT_SAVED]: 75,
  [ASSIGNMENT_PROGRESS_STATES.SUBMITTED]: 100,
  [ASSIGNMENT_PROGRESS_STATES.REVIEWED]: 100
};

export const PROGRESS_EVENT_STATE_MAP = {
  viewed: ASSIGNMENT_PROGRESS_STATES.VIEWED,
  started: ASSIGNMENT_PROGRESS_STATES.STARTED,
  draft_saved: ASSIGNMENT_PROGRESS_STATES.DRAFT_SAVED,
  submitted: ASSIGNMENT_PROGRESS_STATES.SUBMITTED,
  reviewed: ASSIGNMENT_PROGRESS_STATES.REVIEWED
};

export const FINAL_SUBMISSION_STATUSES = new Set(['submitted', 'graded', 'pending']);
export const DRAFT_SUBMISSION_STATUSES = new Set(['draft']);
export const GRADED_SUBMISSION_STATUSES = new Set(['graded']);

export const getAssignmentProgressPercent = (state = ASSIGNMENT_PROGRESS_STATES.NOT_STARTED) =>
  ASSIGNMENT_PROGRESS_PERCENTAGES[state] ?? 0;

export const getAssignmentProgressRank = (state = ASSIGNMENT_PROGRESS_STATES.NOT_STARTED) =>
  ASSIGNMENT_PROGRESS_ORDER.indexOf(state);

export const isFinalSubmissionStatus = (status = '') =>
  FINAL_SUBMISSION_STATUSES.has(String(status).toLowerCase());

export const isDraftSubmissionStatus = (status = '') =>
  DRAFT_SUBMISSION_STATUSES.has(String(status).toLowerCase());

export const isGradedSubmissionStatus = (status = '') =>
  GRADED_SUBMISSION_STATUSES.has(String(status).toLowerCase());

export const progressStateFromSubmissionStatus = (status = '') => {
  const normalizedStatus = String(status).toLowerCase();

  if (normalizedStatus === 'graded') {
    return ASSIGNMENT_PROGRESS_STATES.REVIEWED;
  }

  if (normalizedStatus === 'submitted' || normalizedStatus === 'pending') {
    return ASSIGNMENT_PROGRESS_STATES.SUBMITTED;
  }

  if (normalizedStatus === 'draft') {
    return ASSIGNMENT_PROGRESS_STATES.DRAFT_SAVED;
  }

  return ASSIGNMENT_PROGRESS_STATES.NOT_STARTED;
};
