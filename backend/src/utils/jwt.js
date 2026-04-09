import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

export const generateToken = (payload) => {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    algorithm: 'HS256',
    issuer: env.jwtIssuer,
    audience: env.jwtAudience
  });
};

export const verifyToken = (token) =>
  jwt.verify(token, env.jwtSecret, {
    algorithms: ['HS256'],
    issuer: env.jwtIssuer,
    audience: env.jwtAudience
  });

