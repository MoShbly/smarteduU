import express from 'express';

import {
  createSubmission,
  getSubmissions,
  getSubmissionsByAssignment,
  reviewSubmission,
  saveSubmissionDraft
} from '../../controllers/submission.controller.js';
import { ROLES } from '../../constants/roles.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { submissionUpload } from '../../middlewares/upload.middleware.js';

const router = express.Router();

router.use(protect);
router.get('/assignment/:id', authorize(ROLES.TEACHER), getSubmissionsByAssignment);
router.post('/draft', authorize(ROLES.STUDENT), submissionUpload.single('attachment'), saveSubmissionDraft);
router.patch('/:id/review', authorize(ROLES.TEACHER), reviewSubmission);
router.route('/').get(getSubmissions).post(authorize(ROLES.STUDENT), submissionUpload.single('attachment'), createSubmission);

export default router;

