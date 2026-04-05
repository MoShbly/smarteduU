import { Prisma } from '@prisma/client';

import ApiError from '../utils/ApiError.js';

export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

export const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';

  if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid request data for the database operation';
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      statusCode = 409;
      const duplicateField = error.meta?.target?.[0] || 'field';
      message = `${duplicateField} already exists`;
    }

    if (error.code === 'P2003') {
      statusCode = 400;
      message = 'Related record does not exist or violates a database constraint';
    }

    if (error.code === 'P2025') {
      statusCode = 404;
      message = 'Requested record was not found';
    }
  }

  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired authentication token';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
};
