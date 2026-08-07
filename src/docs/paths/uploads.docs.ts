import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from '../zod.js';
import { successSchema, json, commonErrors, errorSchema } from '../helpers.js';

export function registerUploadPaths(registry: OpenAPIRegistry, _bearer: unknown): void {
  registry.registerPath({
    method: 'post',
    path: '/uploads',
    tags: ['Uploads'],
    summary: 'Upload an image to Supabase Storage',
    description: 'multipart/form-data with a single `file` field (jpg/png/webp, ≤ 5 MB).',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'multipart/form-data': {
            schema: z.object({
              file: z.string().openapi({ type: 'string', format: 'binary' }),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Stored file record',
        content: json(
          successSchema(
            z.object({
              id: z.string().uuid(),
              url: z.string().url(),
              createdAt: z.string().datetime(),
            }),
          ),
        ),
      },
      413: { description: 'File too large', content: json(errorSchema) },
      415: { description: 'Unsupported file type', content: json(errorSchema) },
      ...commonErrors,
    },
  });
}
