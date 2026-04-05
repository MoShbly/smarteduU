import { ROLE_VALUES } from '../constants/roles.js';
import prisma from '../lib/prisma.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/response.js';
import { publicUserSelect } from '../utils/selects.js';

export const getMyProfile = catchAsync(async (req, res) => {
  return sendSuccess(res, {
    data: {
      user: req.user
    }
  });
});

export const listUsers = catchAsync(async (req, res) => {
  const roleFilter = req.query.role;

  if (roleFilter && !ROLE_VALUES.includes(roleFilter)) {
    throw new ApiError(400, 'Invalid role filter');
  }

  const users = await prisma.user.findMany({
    where: roleFilter
      ? {
          role: roleFilter
        }
      : {},
    select: publicUserSelect,
    orderBy: {
      createdAt: 'desc'
    }
  });

  return sendSuccess(res, {
    data: {
      users
    }
  });
});
