import { z } from 'zod';

export const registerSchema = {
  body: z.object({
    username: z
      .string()
      .trim()
      .min(4, 'Username must be at least 4 characters')
      .max(20, 'Username must be at most 20 characters'),
    email: z.string().trim().toLowerCase().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().trim().toLowerCase().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
};

export type RegisterInput = z.infer<typeof registerSchema.body>;
export type LoginInput = z.infer<typeof loginSchema.body>;
