import { z } from 'zod';
import { storagePathSchema } from '../../utils/storagePath.js';

// ProseMirror/Tiptap document: a JSON object with a node "type" and optional
// nested "content". We keep validation permissive (any well-formed object)
// so the editor owns the schema, but require it to be a non-null object.
const proseMirrorDoc = z
  .record(z.any())
  .refine((v) => v && typeof v === 'object' && !Array.isArray(v), {
    message: 'content must be a ProseMirror JSON object',
  });

export const listBlogsSchema = {
  query: z.object({
    search: z.string().trim().optional(),
    tag: z.string().trim().optional(),
    status: z.enum(['draft', 'published']).optional(),
    // "me" scopes the list to the current user's own blogs (draft + published).
    // Only "me" is supported; browsing another user's drafts is never allowed.
    author: z.literal('me').optional(),
    sort: z.enum(['newest', 'oldest', 'most_liked', 'title']).default('newest'),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
};

export const idParamSchema = {
  params: z.object({ id: z.string().uuid('Invalid id') }),
};

export const createBlogSchema = {
  body: z.object({
    title: z.string().trim().min(1, 'Title is required').max(200),
    content: proseMirrorDoc,
    coverImageUrl: storagePathSchema.nullable().optional(),
    status: z.enum(['draft', 'published']).default('draft'),
    tags: z.array(z.string().trim().min(1)).max(20).optional(),
  }),
};

export const updateBlogSchema = {
  params: idParamSchema.params,
  body: z
    .object({
      title: z.string().trim().min(1).max(200).optional(),
      content: proseMirrorDoc.optional(),
      coverImageUrl: storagePathSchema.nullable().optional(),
      status: z.enum(['draft', 'published']).optional(),
      tags: z.array(z.string().trim().min(1)).max(20).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, {
      message: 'At least one field must be provided',
    }),
};

export type ListBlogsQuery = z.infer<typeof listBlogsSchema.query>;
export type CreateBlogInput = z.infer<typeof createBlogSchema.body>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema.body>;
