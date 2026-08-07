import { z } from 'zod';

export const signSchema = {
  body: z.object({
    // Storage paths to resolve into signed URLs (batch).
    paths: z.array(z.string().trim().min(1)).min(1, 'At least one path is required').max(100),
  }),
};

export type SignInput = z.infer<typeof signSchema.body>;
