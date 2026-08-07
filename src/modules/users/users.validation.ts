import { z } from 'zod';

export const updateProfileSchema = {
  body: z
    .object({
      username: z
        .string()
        .trim()
        .min(4, 'Username must be at least 4 characters')
        .max(20, 'Username must be at most 20 characters')
        .optional(),
      avatarUrl: z.string().trim().url('avatarUrl must be a valid URL').nullable().optional(),
    })
    .refine((v) => v.username !== undefined || v.avatarUrl !== undefined, {
      message: 'At least one of username or avatarUrl must be provided',
    }),
};

export const changePasswordSchema = {
  body: z
    .object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string().min(8, 'New password must be at least 8 characters').max(72),
    })
    .refine((v) => v.currentPassword !== v.newPassword, {
      message: 'New password must be different from the current password',
      path: ['newPassword'],
    }),
};

export type UpdateProfileInput = z.infer<typeof updateProfileSchema.body>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema.body>;
