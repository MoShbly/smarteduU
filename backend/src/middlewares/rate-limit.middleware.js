import rateLimit from 'express-rate-limit';

import { env } from '../config/env.js';

const buildLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    validate: { trustProxy: false },
    message: {
      success: false,
      message
    }
  });

export const apiRateLimiter = buildLimiter({
  windowMs: env.apiRateLimitWindowMs,
  max: env.apiRateLimitMax,
  message: 'Too many requests. Please try again later.'
});

export const authRateLimiter = buildLimiter({
  windowMs: env.authRateLimitWindowMs,
  max: env.authRateLimitMax,
  message: 'Too many authentication attempts. Please wait and try again.'
});
