import { Router } from 'express';
import { authController } from './auth.controller.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import { validate } from '../../middlewares/validate.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// Guest-accessible
router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));

// Authenticated (no active-check: a pending/disabled user may still call /auth/*)
router.post('/logout', authMiddleware, asyncHandler(authController.logout));
router.get('/me', authMiddleware, asyncHandler(authController.me));

export default router;
