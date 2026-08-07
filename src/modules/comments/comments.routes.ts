import { Router } from 'express';
import { commentsController } from './comments.controller.js';
import { blogIdParamSchema, createCommentSchema } from './comments.validation.js';
import { validate } from '../../middlewares/validate.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { activeMiddleware } from '../../middlewares/active.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

// mergeParams so :id (blog id) from the parent router is available here.
const router = Router({ mergeParams: true });

router.use(authMiddleware, activeMiddleware);

router.get('/', validate(blogIdParamSchema), asyncHandler(commentsController.list));
router.post('/', validate(createCommentSchema), asyncHandler(commentsController.create));

export default router;
