import { Router } from 'express';
import { usersController } from './users.controller.js';
import { updateProfileSchema, changePasswordSchema } from './users.validation.js';
import { validate } from '../../middlewares/validate.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { activeMiddleware } from '../../middlewares/active.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// All profile routes require an authenticated, active account.
router.use(authMiddleware, activeMiddleware);

router.put('/', validate(updateProfileSchema), asyncHandler(usersController.updateProfile));
router.patch(
  '/password',
  validate(changePasswordSchema),
  asyncHandler(usersController.changePassword),
);

export default router;
