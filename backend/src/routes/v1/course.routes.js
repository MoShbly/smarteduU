import express from 'express';

import { createCourse, getCourses } from '../../controllers/course.controller.js';
import { ROLES } from '../../constants/roles.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.use(protect);
router.route('/').get(getCourses).post(authorize(ROLES.TEACHER), createCourse);

export default router;

