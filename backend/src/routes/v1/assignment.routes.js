import express from 'express';

import {
  createAssignment,
  getAssignments,
  getAssignmentsByCourse,
  trackAssignmentStart,
  trackAssignmentView
} from '../../controllers/assignment.controller.js';
import { ROLES } from '../../constants/roles.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.use(protect);
router.get('/course/:id', getAssignmentsByCourse);
router.post('/:id/view', authorize(ROLES.STUDENT), trackAssignmentView);
router.post('/:id/start', authorize(ROLES.STUDENT), trackAssignmentStart);
router.route('/').get(getAssignments).post(authorize(ROLES.TEACHER), createAssignment);

export default router;

