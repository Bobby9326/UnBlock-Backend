import { z } from 'zod';

export const blogIdParamSchema = {
  params: z.object({ id: z.string().uuid('Invalid blog id') }),
};

export const createCommentSchema = {
  params: z.object({ id: z.string().uuid('Invalid blog id') }),
  body: z.object({
    content: z.string().trim().min(1, 'Comment cannot be empty').max(5000),
    // When present, this comment is a reply to a ROOT comment.
    parentId: z.string().uuid('Invalid parentId').nullable().optional(),
  }),
};

export type CreateCommentInput = z.infer<typeof createCommentSchema.body>;
