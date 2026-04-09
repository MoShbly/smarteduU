const DAY_IN_MS = 24 * 60 * 60 * 1000;
const STATUS_TRANSLATION_KEYS = {
  active: 'status.active',
  draft: 'status.draft',
  graded: 'status.graded',
  pending: 'status.pending',
  submitted: 'status.submitted'
};
const ACTIVITY_TRANSLATION_KEYS = {
  'assignment.created': 'assignmentCreated',
  'assignment.started': 'assignmentStarted',
  'assignment.viewed': 'assignmentViewed',
  'course.created': 'courseCreated',
  'course.joined': 'courseJoined',
  'submission.created': 'submissionCreated',
  'submission.draft_saved': 'submissionDraftSaved',
  'submission.graded': 'submissionReviewed',
  'submission.resubmitted': 'submissionUpdated',
  'submission.reviewed': 'submissionReviewed',
  'submission.updated': 'submissionUpdated',
  'user.logged_in': 'userLoggedIn',
  'user.registered': 'userRegistered'
};
const PROGRESS_TRANSLATION_KEYS = {
  not_started: 'progressStates.notStarted',
  viewed: 'progressStates.viewed',
  started: 'progressStates.started',
  draft_saved: 'progressStates.draftSaved',
  submitted: 'progressStates.submitted',
  reviewed: 'progressStates.reviewed'
};
const TREND_TRANSLATION_KEYS = {
  improving: 'trend.improving',
  declining: 'trend.declining',
  stable: 'trend.stable'
};

const humanizeValue = (value = '') =>
  value
    .replace(/[._-]/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const formatDate = (value, locale, options = {}) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options
  }).format(date);
};

export const formatShortDate = (value, locale) =>
  formatDate(value, locale, {
    month: 'short',
    day: 'numeric'
  });

export const getAverageScore = (entries = []) => {
  if (!entries.length) {
    return null;
  }

  const total = entries.reduce((sum, item) => sum + Number(item.score || 0), 0);
  return Math.round(total / entries.length);
};

export const formatStatusLabel = (value = '', t) => {
  const normalizedValue = value.toLowerCase();
  const translationKey = STATUS_TRANSLATION_KEYS[normalizedValue];

  if (translationKey && t) {
    return t(translationKey);
  }

  return humanizeValue(normalizedValue);
};

export const formatActivityLabel = (value = '', t) => {
  const normalizedValue = value.toLowerCase();
  const translationKey = ACTIVITY_TRANSLATION_KEYS[normalizedValue];

  if (translationKey && t) {
    return t(`actions.${translationKey}`);
  }

  return humanizeValue(normalizedValue);
};

export const formatProgressState = (value = '', t) => {
  const normalizedValue = value.toLowerCase();
  const translationKey = PROGRESS_TRANSLATION_KEYS[normalizedValue];

  if (translationKey && t) {
    return t(translationKey);
  }

  return humanizeValue(normalizedValue);
};

export const formatTrendLabel = (value = '', t) => {
  const normalizedValue = value.toLowerCase();
  const translationKey = TREND_TRANSLATION_KEYS[normalizedValue];

  if (translationKey && t) {
    return t(translationKey);
  }

  return humanizeValue(normalizedValue);
};

export const getSubmissionTone = (status = '') => {
  switch (status.toLowerCase()) {
    case 'draft':
      return 'neutral';
    case 'graded':
      return 'success';
    case 'pending':
      return 'accent';
    case 'submitted':
      return 'warning';
    default:
      return 'neutral';
  }
};

export const getProgressTone = (progressPercent) => {
  if (progressPercent === null || progressPercent === undefined) {
    return 'neutral';
  }

  if (progressPercent >= 100) {
    return 'success';
  }

  if (progressPercent >= 75) {
    return 'accent';
  }

  if (progressPercent >= 50) {
    return 'warning';
  }

  if (progressPercent > 0) {
    return 'neutral';
  }

  return 'critical';
};

export const formatDueState = (value, locale, t) => {
  if (!value) {
    return {
      label: '',
      tone: 'neutral'
    };
  }

  const target = new Date(value);
  const today = new Date();
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const difference = Math.round((targetDay.getTime() - todayDay.getTime()) / DAY_IN_MS);

  if (difference < 0) {
    return {
      label: t('overdue'),
      tone: 'critical'
    };
  }

  if (difference === 0) {
    return {
      label: t('dueToday'),
      tone: 'critical'
    };
  }

  if (difference === 1) {
    return {
      label: t('dueTomorrow'),
      tone: 'warning'
    };
  }

  if (difference <= 7) {
    return {
      label: t('dueInDays', { count: difference }),
      tone: 'warning'
    };
  }

  return {
    label: formatShortDate(value, locale),
    tone: 'neutral'
  };
};
