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

  const token = authHeader.replace('Bearer ', '');
  const decoded = verifyToken(token);

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
