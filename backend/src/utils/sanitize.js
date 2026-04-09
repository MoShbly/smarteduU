const dangerousPattern = /<\/?script[^>]*>/gi;

const sanitizeString = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  return value
    .replace(dangerousPattern, '')
    .replace(/[<>]/g, '')
    .trim();
};

export const sanitizeValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, sanitizeValue(nestedValue)])
    );
  }

  return sanitizeString(value);
};
