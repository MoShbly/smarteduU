import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
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
