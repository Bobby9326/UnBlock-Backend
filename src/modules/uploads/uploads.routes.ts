import { Router } from 'express';
import { uploadsController } from './uploads.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { activeMiddleware } from '../../middlewares/active.middleware.js';
import { uploadSingle } from '../../middlewares/upload.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// active user → validate file (size/type) → handle
router.post(
  '/',
  authMiddleware,
  activeMiddleware,
  uploadSingle('file'),
  asyncHandler(uploadsController.upload),
);

export default router;
