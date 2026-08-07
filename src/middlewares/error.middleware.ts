import { Prisma } from '@prisma/client';
import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../utils/AppError.js';
import { isProduction } from '../config/env.js';

// Centralized error handler — the last middleware in the stack.
// Produces a consistent { success:false, error:{ code, message, details? } } body.
export const errorMiddleware: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong';
  let details: unknown;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      code = 'CONFLICT';
      const target = Array.isArray(err.meta?.target)
        ? (err.meta.target as string[]).join(', ')
        : 'field';
      message = `A record with this ${target} already exists`;
    } else if (err.code === 'P2025') {
      statusCode = 404;
      code = 'NOT_FOUND';
      message = 'Record not found';
    } else {
      statusCode = 400;
      code = 'DATABASE_ERROR';
      message = 'Database request failed';
    }
  } else if ((err as { type?: string }).type === 'entity.parse.failed') {
    statusCode = 400;
    code = 'BAD_REQUEST';
    message = 'Malformed JSON in request body';
  }

  if (statusCode >= 500) {
    console.error('[error]', err);
  }

  const body: {
    success: false;
    error: { code: string; message: string; details?: unknown; stack?: string };
  } = { success: false, error: { code, message } };
  if (details) body.error.details = details;
  if (!isProduction && statusCode >= 500 && err instanceof Error) body.error.stack = err.stack;

  res.status(statusCode).json(body);
};

// 404 handler for unmatched routes.
export function notFoundMiddleware(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
