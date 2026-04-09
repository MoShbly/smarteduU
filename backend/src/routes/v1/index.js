import express from 'express';

import activityRoutes from './activity.routes.js';
import assignmentRoutes from './assignment.routes.js';
import authRoutes from './auth.routes.js';
import courseRoutes from './course.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import submissionRoutes from './submission.routes.js';
import userRoutes from './user.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/activity', activityRoutes);
router.use('/courses', courseRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/submissions', submissionRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;

