import crypto from 'node:crypto';

const normalizeToken = (value) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

export const buildCourseCodeCandidate = ({ title = '', subject = '' }) => {
  const titleTokens = normalizeToken(title);
  const subjectTokens = normalizeToken(subject);
  const prefixSource = [...subjectTokens, ...titleTokens];

  const prefix = prefixSource
    .map((token) => token[0])
    .join('')
    .slice(0, 3)
    .padEnd(3, 'C');

  const suffix = crypto.randomBytes(3).toString('hex').slice(0, 6).toUpperCase();

  return `${prefix}-${suffix}`;
};
