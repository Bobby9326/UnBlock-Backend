import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from '../zod.js';
import { signSchema } from '../../modules/uploads/uploads.validation.js';
import { successSchema, json, commonErrors, errorSchema } from '../helpers.js';

export function registerUploadPaths(registry: OpenAPIRegistry, _bearer: unknown): void {
  registry.registerPath({
    method: 'post',
    path: '/uploads',
    tags: ['Uploads'],
    summary: 'Upload an image to Supabase Storage (private bucket)',
    description:
      'multipart/form-data with a single `file` field (jpg/png/webp, ≤ 5 MB). ' +
      'The bucket is private: **persist the returned `path`** in blog content / ' +
      'coverImageUrl / avatarUrl. `url` is a short-lived signed URL for immediate ' +
      'preview only — do not store it.',
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
              path: z.string().openapi({ description: 'Canonical storage key — persist THIS' }),
              url: z
                .string()
                .nullable()
                .openapi({ description: 'Signed preview URL (expires) — do not store' }),
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

  registry.registerPath({
    method: 'post',
    path: '/uploads/sign',
    tags: ['Uploads'],
    summary: 'Resolve storage paths into short-lived signed view URLs',
    description:
      'Batch-exchange up to 100 stored paths for signed URLs. Call this before ' +
      'rendering images (cover, avatar, inline blog images). URLs expire — ' +
      're-resolve on page load.',
    security: [{ bearerAuth: [] }],
    request: { body: { content: json(signSchema.body) } },
    responses: {
      200: {
        description: 'Map of path → signed URL (null if a path could not be signed)',
        content: json(
          successSchema(
            z.object({
              urls: z
                .record(z.string().nullable())
                .openapi({ description: '{ "<path>": "<signedUrl|null>" }' }),
            }),
          ),
        ),
      },
      ...commonErrors,
    },
  });
}
