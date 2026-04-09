import express from 'express';

import { getActivityFeed } from '../../controllers/activity.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);
router.get('/', getActivityFeed);

export default router;
