import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/response.js';
import { getRelevantActivities } from '../services/activity-log.service.js';

export const getActivityFeed = catchAsync(async (req, res) => {
  const requestedTake = Number(req.query.take || 12);
  const take = Number.isNaN(requestedTake) ? 12 : Math.min(Math.max(requestedTake, 1), 50);

  const activities = await getRelevantActivities({
    userId: req.user.id,
    role: req.user.role,
    take
  });

  return sendSuccess(res, {
    data: {
      activities
    }
  });
});
