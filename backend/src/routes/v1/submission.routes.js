import express from 'express';

import { createSubmission, getSubmissions } from '../../controllers/submission.controller.js';
import { ROLES } from '../../constants/roles.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.use(protect);
router.route('/').get(getSubmissions).post(authorize(ROLES.STUDENT), createSubmission);

export default router;

