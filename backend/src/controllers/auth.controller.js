import bcrypt from 'bcryptjs';

import prisma from '../lib/prisma.js';
import { logActivity } from '../services/activity-log.service.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { generateToken } from '../utils/jwt.js';
import { sendSuccess } from '../utils/response.js';
import { publicUserSelect } from '../utils/selects.js';

const buildAuthResponse = (user) => ({
  token: generateToken({ sub: user.id, role: user.role }),
  user
});

export const register = catchAsync(async (req, res) => {
  const { name, email, password, role } = req.body;

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail
    },
    select: {
      id: true
    }
  });

  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role
    },
    select: publicUserSelect
  });

  await logActivity({
    actorId: user.id,
    action: 'user.registered',
    entityType: 'User',
    entityId: user.id,
    details: {
      role: user.role
    }
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Registration successful',
    data: buildAuthResponse(user)
  });
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: {
      email: email.toLowerCase().trim()
    }
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'This account is currently inactive');
  }

  await logActivity({
    actorId: user.id,
    action: 'user.logged_in',
    entityType: 'User',
    entityId: user.id,
    details: {
      role: user.role
    }
  });

  return sendSuccess(res, {
    message: 'Login successful',
    data: buildAuthResponse({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    })
  });
});

export const getCurrentUser = catchAsync(async (req, res) => {
  return sendSuccess(res, {
    data: {
      user: req.user
    }
  });
});
