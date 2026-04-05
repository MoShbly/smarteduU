import prisma from '../lib/prisma.js';

export const logActivity = ({ actorId, action, entityType, entityId, details = {} }) => {
  return prisma.activityLog.create({
    data: {
      actorId,
      action,
      entityType,
      entityId,
      details
    }
  });
};
