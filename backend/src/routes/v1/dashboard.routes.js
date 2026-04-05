import express from 'express';

import { getDashboard, getStudentDashboard, getTeacherDashboard } from '../../controllers/dashboard.controller.js';
import { ROLES } from '../../constants/roles.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.use(protect);
router.get('/', getDashboard);
router.get('/teacher', authorize(ROLES.TEACHER), getTeacherDashboard);
router.get('/student', authorize(ROLES.STUDENT), getStudentDashboard);

export default router;
