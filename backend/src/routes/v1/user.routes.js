import express from 'express';

import { getMyProfile, listUsers } from '../../controllers/user.controller.js';
import { ROLES } from '../../constants/roles.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.use(protect);
router.get('/me', getMyProfile);
router.get('/', authorize(ROLES.TEACHER), listUsers);

export default router;

