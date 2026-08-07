import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from '../zod.js';
import { listTagsSchema } from '../../modules/tags/tags.validation.js';
import { successSchema, json, commonErrors } from '../helpers.js';

const tagSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    blogCount: z.number().int(),
  })
  .openapi('Tag');

export function registerTagPaths(registry: OpenAPIRegistry, _bearer: unknown): void {
  registry.registerPath({
    method: 'get',
    path: '/tags',
    tags: ['Tags'],
    summary: 'List tags with blog counts (for autocomplete / filters)',
    description:
      'Tag names are normalized (lowercased, trimmed). Use `?search=` for prefix/substring autocomplete.',
    security: [{ bearerAuth: [] }],
    request: { query: listTagsSchema.query },
    responses: {
      200: {
        description: 'Tags ordered by popularity then name',
        content: json(successSchema(z.object({ tags: z.array(tagSchema) }))),
      },
      ...commonErrors,
    },
  });
}
