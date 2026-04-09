import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/response.js';
import {
  buildStudentAnalytics,
  buildStudentDashboard,
  buildTeacherAnalytics,
  buildTeacherDashboard
} from '../services/dashboard-analytics.service.js';

export const getDashboard = catchAsync(async (req, res) => {
  const data =
    req.user.role === 'teacher'
      ? await buildTeacherDashboard(req.user.id)
      : await buildStudentDashboard(req.user.id);

  return sendSuccess(res, {
    data
  });
});

export const getTeacherDashboard = catchAsync(async (req, res) => {
  const data = await buildTeacherDashboard(req.user.id);

  return sendSuccess(res, {
    data
  });
});

export const getStudentDashboard = catchAsync(async (req, res) => {
  const data = await buildStudentDashboard(req.user.id);

  return sendSuccess(res, {
    data
  });
});

export const getAnalytics = catchAsync(async (req, res) => {
  const data =
    req.user.role === 'teacher'
      ? await buildTeacherAnalytics(req.user.id)
      : await buildStudentAnalytics(req.user.id);

  return sendSuccess(res, {
    data
  });
});
