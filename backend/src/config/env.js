import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtIssuer: process.env.JWT_ISSUER || String('smart-classroom-api'),
  jwtAudience: process.env.JWT_AUDIENCE || String('smart-classroom-app'),
  apiRateLimitWindowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  apiRateLimitMax: Number(process.env.API_RATE_LIMIT_MAX || 300),
  authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000'
};

const requiredKeys = ['databaseUrl', 'jwtSecret'];

const requiredKeyLabels = {
  databaseUrl: 'DATABASE_URL',
  jwtSecret: 'JWT_SECRET'
};

requiredKeys.forEach((key) => {
  if (!env[key]) {
    throw new Error(`Missing required environment variable: ${requiredKeyLabels[key]}`);
  }
});
