import { Router } from 'express';
import { uploadsController } from './uploads.controller.js';
import { signSchema } from './uploads.validation.js';
import { validate } from '../../middlewares/validate.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { activeMiddleware } from '../../middlewares/active.middleware.js';
import { uploadSingle } from '../../middlewares/upload.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// All upload routes require an authenticated, active account.
router.use(authMiddleware, activeMiddleware);

// active user → validate file (size/type) → handle
router.post('/', uploadSingle('file'), asyncHandler(uploadsController.upload));

// Resolve stored paths into short-lived signed URLs for viewing.
router.post('/sign', validate(signSchema), asyncHandler(uploadsController.sign));

export default router;
