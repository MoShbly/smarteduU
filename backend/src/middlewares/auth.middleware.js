import prisma from '../lib/prisma.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { publicUserSelect } from '../utils/selects.js';
import { verifyToken } from '../utils/jwt.js';

export const protect = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication token is missing');
  }

  const token = authHeader.slice(7).trim();
  let decoded;

  try {
    decoded = verifyToken(token);
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired authentication token');
  }

  if (!decoded?.sub) {
    throw new ApiError(401, 'Invalid authentication token payload');
  }

  const user = await prisma.user.findUnique({
    where: {
      id: decoded.sub
    },
    select: publicUserSelect
  });

  if (!user || !user.isActive) {
    throw new ApiError(401, 'User not found or inactive');
  }

  req.user = user;
  next();
});
