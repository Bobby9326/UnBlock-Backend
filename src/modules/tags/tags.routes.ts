import { Router } from 'express';
import { tagsController } from './tags.controller.js';
import { listTagsSchema } from './tags.validation.js';
import { validate } from '../../middlewares/validate.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { activeMiddleware } from '../../middlewares/active.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// Authenticated, active users can browse the tag list (for autocomplete).
router.use(authMiddleware, activeMiddleware);

router.get('/', validate(listTagsSchema), asyncHandler(tagsController.list));

export default router;
