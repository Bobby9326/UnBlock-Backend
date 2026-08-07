import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';

// Blocks any user whose status is not "active".
// Must run AFTER authMiddleware.
export function activeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) return next(AppError.unauthorized());

  if (req.user.status !== 'active') {
    const reason =
      req.user.status === 'pending'
        ? 'Your account is pending approval by an administrator'
        : 'Your account has been disabled';
    return next(new AppError(403, 'ACCOUNT_NOT_ACTIVE', reason));
  }

  next();
}
