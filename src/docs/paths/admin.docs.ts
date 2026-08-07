import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from '../zod.js';
import {
  listUsersSchema,
  listBlogsSchema,
  idParamSchema,
  updateUserSchema,
  resetPasswordSchema,
} from '../../modules/admin/admin.validation.js';
import {
  successSchema,
  listSchema,
  userSchema,
  authorSchema,
  json,
  commonErrors,
} from '../helpers.js';

const adminBlogSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    status: z.enum(['draft', 'published']),
    author: authorSchema,
    coverImageUrl: z.string().url().nullable(),
    likeCount: z.number().int(),
    commentCount: z.number().int(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi('AdminBlog');

export function registerAdminPaths(registry: OpenAPIRegistry, _bearer: unknown): void {
  const sec = [{ bearerAuth: [] }];

  registry.registerPath({
    method: 'get',
    path: '/admin/users',
    tags: ['Admin'],
    summary: 'List users (search / filter / paginate)',
    security: sec,
    request: { query: listUsersSchema.query },
    responses: {
      200: { description: 'Paginated users', content: json(listSchema(userSchema)) },
      ...commonErrors,
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/admin/users/{id}/activate',
    tags: ['Admin'],
    summary: 'Activate a user',
    security: sec,
    request: { params: idParamSchema.params },
    responses: {
      200: { description: 'Activated', content: json(successSchema(z.object({ user: userSchema }))) },
      ...commonErrors,
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/admin/users/{id}/disable',
    tags: ['Admin'],
    summary: 'Disable a user',
    security: sec,
    request: { params: idParamSchema.params },
    responses: {
      200: { description: 'Disabled', content: json(successSchema(z.object({ user: userSchema }))) },
      ...commonErrors,
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/admin/users/{id}',
    tags: ['Admin'],
    summary: "Edit another user's fields",
    security: sec,
    request: { params: idParamSchema.params, body: { content: json(updateUserSchema.body) } },
    responses: {
      200: { description: 'Updated', content: json(successSchema(z.object({ user: userSchema }))) },
      ...commonErrors,
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/admin/users/{id}/reset-password',
    tags: ['Admin'],
    summary: 'Reset a user password (no current password needed)',
    security: sec,
    request: { params: idParamSchema.params, body: { content: json(resetPasswordSchema.body) } },
    responses: {
      200: {
        description: 'Reset',
        content: json(successSchema(z.object({ message: z.string() }))),
      },
      ...commonErrors,
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/admin/users/{id}',
    tags: ['Admin'],
    summary: 'Delete a user',
    security: sec,
    request: { params: idParamSchema.params },
    responses: {
      200: {
        description: 'Deleted',
        content: json(successSchema(z.object({ message: z.string() }))),
      },
      ...commonErrors,
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/admin/blogs',
    tags: ['Admin'],
    summary: "List all authors' blogs",
    security: sec,
    request: { query: listBlogsSchema.query },
    responses: {
      200: { description: 'Paginated blogs', content: json(listSchema(adminBlogSchema)) },
      ...commonErrors,
    },
  });
}
