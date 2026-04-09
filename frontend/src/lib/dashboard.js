const DAY_IN_MS = 24 * 60 * 60 * 1000;

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

export const formatStatusLabel = (value = '') =>
  value
    .replace(/[._-]/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const getSubmissionTone = (status = '') => {
  switch (status.toLowerCase()) {
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
