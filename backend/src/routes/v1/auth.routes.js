import express from 'express';

import { getCurrentUser, login, register } from '../../controllers/auth.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authRateLimiter } from '../../middlewares/rate-limit.middleware.js';
import { validateLoginInput, validateRegisterInput } from '../../middlewares/validation.middleware.js';

const router = express.Router();

router.post('/register', authRateLimiter, validateRegisterInput, register);
router.post('/login', authRateLimiter, validateLoginInput, login);
router.get('/me', protect, getCurrentUser);

export default router;

