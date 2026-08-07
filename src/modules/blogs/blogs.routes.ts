import { Router } from 'express';
import { blogsController } from './blogs.controller.js';
import {
  listBlogsSchema,
  idParamSchema,
  createBlogSchema,
  updateBlogSchema,
} from './blogs.validation.js';
import { validate } from '../../middlewares/validate.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { activeMiddleware } from '../../middlewares/active.middleware.js';
import { requireOwnership } from '../../middlewares/ownership.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// Every blog route requires an authenticated, active account.
router.use(authMiddleware, activeMiddleware);

router.get('/', validate(listBlogsSchema), asyncHandler(blogsController.list));
router.get('/:id', validate(idParamSchema), asyncHandler(blogsController.getById));
router.post('/', validate(createBlogSchema), asyncHandler(blogsController.create));

// Update: owner only.
router.put(
  '/:id',
  validate(updateBlogSchema),
  requireOwnership('blog'),
  asyncHandler(blogsController.update),
);

// Delete: owner or super admin.
router.delete(
  '/:id',
  validate(idParamSchema),
  requireOwnership('blog', { allowSuperAdmin: true }),
  asyncHandler(blogsController.remove),
);

export default router;
