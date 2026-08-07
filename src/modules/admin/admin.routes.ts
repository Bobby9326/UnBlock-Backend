import { Router } from 'express';
import { adminController } from './admin.controller.js';
import {
  listUsersSchema,
  listBlogsSchema,
  idParamSchema,
  updateUserSchema,
  resetPasswordSchema,
} from './admin.validation.js';
import { validate } from '../../middlewares/validate.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { activeMiddleware } from '../../middlewares/active.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// Chain: verify JWT → must be active → must be super_admin.
router.use(authMiddleware, activeMiddleware, requireRole('super_admin'));

// ── User management ──────────────────────────────────────
router.get('/users', validate(listUsersSchema), asyncHandler(adminController.listUsers));
router.patch(
  '/users/:id/activate',
  validate(idParamSchema),
  asyncHandler(adminController.activateUser),
);
router.patch(
  '/users/:id/disable',
  validate(idParamSchema),
  asyncHandler(adminController.disableUser),
);
router.patch('/users/:id', validate(updateUserSchema), asyncHandler(adminController.updateUser));
router.post(
  '/users/:id/reset-password',
  validate(resetPasswordSchema),
  asyncHandler(adminController.resetPassword),
);
router.delete('/users/:id', validate(idParamSchema), asyncHandler(adminController.deleteUser));

// ── Blog management ──────────────────────────────────────
router.get('/blogs', validate(listBlogsSchema), asyncHandler(adminController.listBlogs));

export default router;
