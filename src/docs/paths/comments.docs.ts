import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from '../zod.js';
import {
  blogIdParamSchema,
  createCommentSchema,
} from '../../modules/comments/comments.validation.js';
import { successSchema, commentSchema, replySchema, json, commonErrors } from '../helpers.js';

export function registerCommentPaths(registry: OpenAPIRegistry, _bearer: unknown): void {
  registry.registerPath({
    method: 'get',
    path: '/blogs/{id}/comments',
    tags: ['Comments'],
    summary: 'List comments as a nested tree (root comments with replies[])',
    security: [{ bearerAuth: [] }],
    request: { params: blogIdParamSchema.params },
    responses: {
      200: {
        description: 'Comment tree',
        content: json(successSchema(z.object({ comments: z.array(commentSchema) }))),
      },
      ...commonErrors,
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/blogs/{id}/comments',
    tags: ['Comments'],
    summary: 'Create a comment or a one-level reply',
    description:
      'If `parentId` is provided it must reference a ROOT comment; replying to a reply is rejected.',
    security: [{ bearerAuth: [] }],
    request: {
      params: createCommentSchema.params,
      body: { content: json(createCommentSchema.body) },
    },
    responses: {
      201: {
        description: 'Created comment',
        content: json(successSchema(z.object({ comment: replySchema }))),
      },
      ...commonErrors,
    },
  });
}
