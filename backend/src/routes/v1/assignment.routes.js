import express from 'express';

import { createAssignment, getAssignments } from '../../controllers/assignment.controller.js';
import { ROLES } from '../../constants/roles.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.use(protect);
router.route('/').get(getAssignments).post(authorize(ROLES.TEACHER), createAssignment);

export default router;

