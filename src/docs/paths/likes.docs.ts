import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from '../zod.js';
import { blogIdParamSchema } from '../../modules/comments/comments.validation.js';
import { successSchema, json, commonErrors } from '../helpers.js';

export function registerLikePaths(registry: OpenAPIRegistry, _bearer: unknown): void {
  registry.registerPath({
    method: 'post',
    path: '/blogs/{id}/like',
    tags: ['Likes'],
    summary: 'Toggle like/unlike for a blog',
    security: [{ bearerAuth: [] }],
    request: { params: blogIdParamSchema.params },
    responses: {
      200: {
        description: 'New like state and total count',
        content: json(
          successSchema(z.object({ liked: z.boolean(), count: z.number().int() })),
        ),
      },
      ...commonErrors,
    },
  });
}
