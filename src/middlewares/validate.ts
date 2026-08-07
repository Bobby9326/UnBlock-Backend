import { ZodError, type ZodTypeAny } from 'zod';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { AppError } from '../utils/AppError.js';

export interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

// Validates and coerces req.body / req.query / req.params against a Zod schema.
// Parsed values replace the originals (query goes to req.validatedQuery since
// req.query is read-only in Express 5-typed environments).
export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.validatedQuery = schemas.query.parse(req.query);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        }));
        return next(AppError.badRequest('Validation failed', details));
      }
      next(err);
    }
  };
}
