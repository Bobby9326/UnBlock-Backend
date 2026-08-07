import { Router } from 'express';

import healthRoutes from '../modules/health/health.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import usersRoutes from '../modules/users/users.routes.js';
import blogsRoutes from '../modules/blogs/blogs.routes.js';
import commentsRoutes from '../modules/comments/comments.routes.js';
import likesRoutes from '../modules/likes/likes.routes.js';
import notificationsRoutes from '../modules/notifications/notifications.routes.js';
import uploadsRoutes from '../modules/uploads/uploads.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';

const router = Router();

router.use('/health', healthRoutes);

router.use('/auth', authRoutes);
router.use('/profile', usersRoutes);
router.use('/blogs', blogsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/uploads', uploadsRoutes);
router.use('/admin', adminRoutes);

// Nested resources under a blog.
router.use('/blogs/:id/comments', commentsRoutes);
router.use('/blogs/:id/like', likesRoutes);

export default router;
