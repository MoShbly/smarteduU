import express from 'express';

import { createCourse, getCourses, joinCourse } from '../../controllers/course.controller.js';
import { ROLES } from '../../constants/roles.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.use(protect);
router.post('/join', authorize(ROLES.STUDENT), joinCourse);
router.route('/').get(getCourses).post(authorize(ROLES.TEACHER), createCourse);

export default router;

