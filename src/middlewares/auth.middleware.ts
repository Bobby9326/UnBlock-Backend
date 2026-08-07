import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';

// Extracts the JWT from the httpOnly auth cookie (browser clients) or, failing
// that, the Authorization: Bearer header (Swagger / curl / mobile).
function extractToken(req: Request): string | null {
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.[env.authCookieName];
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization || '';
  const [scheme, headerToken] = header.split(' ');
  if (scheme === 'Bearer' && headerToken) return headerToken;

  return null;
}

// Verifies the JWT and loads the current user onto req.user.
// Runs FIRST in the middleware chain for protected routes.
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      throw AppError.unauthorized('Missing authentication token');
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw AppError.unauthorized('Invalid or expired token');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        avatarUrl: true,
      },
    });

    if (!user) throw AppError.unauthorized('User no longer exists');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
