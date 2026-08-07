import { z } from 'zod';

export const listUsersSchema = {
  query: z.object({
    search: z.string().trim().optional(),
    status: z.enum(['pending', 'active', 'disabled']).optional(),
    role: z.enum(['super_admin', 'general_user']).optional(),
    sort: z.enum(['newest', 'oldest', 'username']).default('newest'),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
};

export const listBlogsSchema = {
  query: z.object({
    search: z.string().trim().optional(),
    status: z.enum(['draft', 'published']).optional(),
    authorId: z.string().uuid().optional(),
    sort: z.enum(['newest', 'oldest', 'most_liked', 'title']).default('newest'),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
};

export const idParamSchema = {
  params: z.object({ id: z.string().uuid('Invalid id') }),
};

export const updateUserSchema = {
  params: idParamSchema.params,
  body: z
    .object({
      username: z.string().trim().min(4).max(20).optional(),
      email: z.string().trim().toLowerCase().email().optional(),
      role: z.enum(['super_admin', 'general_user']).optional(),
      status: z.enum(['pending', 'active', 'disabled']).optional(),
      avatarUrl: z.string().trim().url().nullable().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, {
      message: 'At least one field must be provided',
    }),
};

export const resetPasswordSchema = {
  params: idParamSchema.params,
  body: z.object({
    newPassword: z.string().min(8, 'New password must be at least 8 characters').max(72),
  }),
};

export type ListUsersQuery = z.infer<typeof listUsersSchema.query>;
export type ListBlogsQuery = z.infer<typeof listBlogsSchema.query>;
export type UpdateUserInput = z.infer<typeof updateUserSchema.body>;
