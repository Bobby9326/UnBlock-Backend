import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { Role } from '@prisma/client';
import { AppError } from '../utils/AppError.js';

// Restricts a route to one of the allowed roles.
// Must run AFTER authMiddleware. Usage: requireRole('super_admin')
export function requireRole(...allowedRoles: Role[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden('This action requires elevated privileges'));
    }
    next();
  };
}
