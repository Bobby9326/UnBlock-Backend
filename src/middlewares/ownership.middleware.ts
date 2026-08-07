import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { AppError } from '../utils/AppError.js';
import { prisma } from '../config/database.js';

type OwnershipResource = 'blog' | 'comment';

// Factory: ensures the current user owns the target resource.
// Super admins bypass ownership when `allowSuperAdmin` is true.
export function requireOwnership(
  resource: OwnershipResource,
  { allowSuperAdmin = false }: { allowSuperAdmin?: boolean } = {},
): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      if (!req.user) return next(AppError.unauthorized());

      let ownerId: string;
      if (resource === 'blog') {
        const blog = await prisma.blog.findUnique({
          where: { id },
          select: { authorId: true },
        });
        if (!blog) throw AppError.notFound('Blog not found');
        ownerId = blog.authorId;
      } else {
        const comment = await prisma.comment.findUnique({
          where: { id },
          select: { userId: true },
        });
        if (!comment) throw AppError.notFound('Comment not found');
        ownerId = comment.userId;
      }

      const isOwner = ownerId === req.user.id;
      const isSuperAdmin = allowSuperAdmin && req.user.role === 'super_admin';

      if (!isOwner && !isSuperAdmin) {
        throw AppError.forbidden('You are not the owner of this resource');
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
