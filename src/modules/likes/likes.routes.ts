import { Router } from 'express';
import { likesController } from './likes.controller.js';
import { blogIdParamSchema } from '../comments/comments.validation.js';
import { validate } from '../../middlewares/validate.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { activeMiddleware } from '../../middlewares/active.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

// mergeParams to read :id (blog id) from the parent blogs router.
const router = Router({ mergeParams: true });

router.use(authMiddleware, activeMiddleware);

router.post('/', validate(blogIdParamSchema), asyncHandler(likesController.toggle));

export default router;
