import { z } from './zod.js';

// Image fields store a storage PATH (private bucket) — resolve via
// POST /uploads/sign before display. Documented as such, not a URL.
const storagePath = z
  .string()
  .openapi({ description: 'Storage path (resolve via POST /uploads/sign, not a URL)' });

// Reusable response-body factories mirroring src/utils/response.ts envelopes.

export function successSchema<T extends z.ZodTypeAny>(data: T) {
  return z.object({ success: z.literal(true), data });
}

export function listSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    success: z.literal(true),
    data: z.array(item),
    meta: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
    }),
  });
}

// Standard error envelope from error.middleware.ts.
export const errorSchema = z
  .object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.unknown().optional(),
    }),
  })
  .openapi('ErrorResponse');

// Common error responses attached to most operations.
export const commonErrors = {
  400: { description: 'Validation / bad request', content: json(errorSchema) },
  401: { description: 'Missing or invalid token', content: json(errorSchema) },
  403: { description: 'Not allowed (inactive account or insufficient role)', content: json(errorSchema) },
  404: { description: 'Resource not found', content: json(errorSchema) },
};

// Wrap a schema as an application/json content body.
export function json<T extends z.ZodTypeAny>(schema: T) {
  return { 'application/json': { schema } };
}

// ── Reusable entity shapes (documentation only) ───────────

export const userSchema = z
  .object({
    id: z.string().uuid(),
    username: z.string(),
    email: z.string().email(),
    role: z.enum(['super_admin', 'general_user']),
    status: z.enum(['pending', 'active', 'disabled']),
    avatarUrl: storagePath.nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi('User');

export const authorSchema = z
  .object({
    id: z.string().uuid(),
    username: z.string(),
    avatarUrl: storagePath.nullable(),
  })
  .openapi('Author');

export const blogSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    content: z.record(z.any()).openapi({ description: 'ProseMirror/Tiptap JSON document' }),
    coverImageUrl: storagePath.nullable(),
    status: z.enum(['draft', 'published']),
    author: authorSchema,
    tags: z.array(z.string()),
    likeCount: z.number().int(),
    commentCount: z.number().int(),
    isLikedByMe: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi('Blog');

// A reply (leaf) — replies never nest further, so no recursion is needed.
export const replySchema = z
  .object({
    id: z.string().uuid(),
    content: z.string(),
    parentId: z.string().uuid().nullable(),
    user: authorSchema,
    createdAt: z.string().datetime(),
  })
  .openapi('Reply');

// A root comment carries a flat array of replies (one level deep).
export const commentSchema = z
  .object({
    id: z.string().uuid(),
    content: z.string(),
    parentId: z.string().uuid().nullable(),
    user: authorSchema,
    createdAt: z.string().datetime(),
    replies: z.array(replySchema),
  })
  .openapi('Comment');

export const notificationSchema = z
  .object({
    id: z.string().uuid(),
    recipientId: z.string().uuid(),
    type: z.enum(['comment', 'reply', 'like', 'system']),
    referenceId: z.string().nullable(),
    message: z.string(),
    isRead: z.boolean(),
    isCleared: z.boolean(),
    createdAt: z.string().datetime(),
  })
  .openapi('Notification');
