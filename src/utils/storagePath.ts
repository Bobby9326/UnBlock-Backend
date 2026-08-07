import { z } from 'zod';

// A Supabase Storage object key, e.g. "3f9a.../a1b2c3.png".
// Not a URL — the private-bucket model stores paths and signs them on read.
// We keep it permissive but reject anything that could escape the bucket or
// is obviously a leftover URL (a signed/public link accidentally saved).
export const storagePathSchema = z
  .string()
  .trim()
  .min(1)
  .max(512)
  .refine((v) => !/^https?:\/\//i.test(v), {
    message: 'Expected a storage path, not a URL',
  })
  .refine((v) => !v.startsWith('/') && !v.includes('..'), {
    message: 'Invalid storage path',
  });
