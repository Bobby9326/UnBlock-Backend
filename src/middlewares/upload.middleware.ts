import multer from 'multer';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { upload } from '../config/multer.js';
import { AppError } from '../utils/AppError.js';

// Wraps multer's single-file handler and normalizes its errors into AppError.
export function uploadSingle(field: string): RequestHandler {
  const handler = upload.single(field);
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, (err: unknown) => {
      if (!err) {
        if (!req.file) return next(AppError.badRequest('No file provided'));
        return next();
      }
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(AppError.payloadTooLarge('File exceeds the maximum allowed size'));
        }
        return next(AppError.badRequest(`Upload error: ${err.code}`));
      }
      if ((err as { code?: string }).code === 'UNSUPPORTED_FILE_TYPE') {
        return next(AppError.unsupportedMediaType('Only jpg, png and webp images are allowed'));
      }
      next(err);
    });
  };
}
