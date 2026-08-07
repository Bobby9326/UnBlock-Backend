import { Router } from 'express';
import { notificationsController } from './notifications.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { activeMiddleware } from '../../middlewares/active.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.use(authMiddleware, activeMiddleware);

router.get('/', asyncHandler(notificationsController.list));
router.patch('/read-all', asyncHandler(notificationsController.readAll));
router.delete('/', asyncHandler(notificationsController.clearAll));

export default router;
