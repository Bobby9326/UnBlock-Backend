import crypto from 'node:crypto';
import path from 'node:path';
import { uploadsRepository } from './uploads.repository.js';
import { bucket } from '../../config/supabase.js';
import { AppError } from '../../utils/AppError.js';
import { env } from '../../config/env.js';

interface RegisterUploadInput {
  file: Express.Multer.File;
  uploaderId: string;
}

// Upload a buffered file to Supabase Storage and record it. is_referenced
// stays false until a blog actually uses the URL; the cleanup job reaps
// anything still unreferenced.
export const uploadsService = {
  async registerUpload({ file, uploaderId }: RegisterUploadInput) {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    // Namespace by uploader for tidiness; random name avoids collisions.
    const objectPath = `${uploaderId}/${crypto.randomUUID()}${ext}`;

    const { error } = await bucket().upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });
    if (error) {
      throw new AppError(502, 'STORAGE_ERROR', `Failed to upload file: ${error.message}`);
    }

    const { data } = bucket().getPublicUrl(objectPath);
    const publicUrl = data.publicUrl;

    const record = await uploadsRepository.create({
      url: publicUrl,
      path: objectPath,
      uploaderId,
      isReferenced: false,
    });

    return { id: record.id, url: record.url, createdAt: record.createdAt };
  },

  // Delete orphan objects (unreferenced, older than the configured age) from
  // both the bucket and the database.
  async cleanupOrphans() {
    const cutoff = new Date(Date.now() - env.orphanMaxAgeHours * 60 * 60 * 1000);
    const orphans = await uploadsRepository.findOrphans(cutoff);
    if (!orphans.length) return { scanned: 0, deleted: 0 };

    const paths = orphans.map((o) => o.path);
    const { error } = await bucket().remove(paths);
    if (error) {
      console.error('[cleanup] bucket remove failed:', error.message);
      return { scanned: orphans.length, deleted: 0 };
    }

    await uploadsRepository.deleteByIds(orphans.map((o) => o.id));
    return { scanned: orphans.length, deleted: orphans.length };
  },
};
