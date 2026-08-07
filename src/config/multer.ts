import multer from 'multer';
import type { Request } from 'express';
import { env } from './env.js';

// Buffer uploads in memory; the service streams the buffer to Supabase Storage.
// No local disk is touched.
const storage = multer.memoryStorage();

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  if ((env.allowedMimeTypes as readonly string[]).includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error('UNSUPPORTED_FILE_TYPE') as Error & { code: string };
    err.code = 'UNSUPPORTED_FILE_TYPE';
    cb(err);
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.maxUploadBytes },
});
