import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from '../zod.js';
import { json } from '../helpers.js';

export function registerHealthPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/health',
    tags: ['Health'],
    summary: 'Liveness check (no DB) — keeps Render awake',
    responses: {
      200: {
        description: 'Service is up',
        content: json(
          z.object({ success: z.literal(true), data: z.object({ status: z.string() }) }),
        ),
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/health/db',
    tags: ['Health'],
    summary: 'Readiness check — pings the database (keeps Supabase awake)',
    responses: {
      200: {
        description: 'Database reachable',
        content: json(
          z.object({
            success: z.literal(true),
            data: z.object({
              status: z.string(),
              database: z.string(),
              latencyMs: z.number().int(),
            }),
          }),
        ),
      },
      503: {
        description: 'Database unreachable',
        content: json(
          z.object({
            success: z.literal(false),
            error: z.object({ code: z.string(), message: z.string() }),
          }),
        ),
      },
    },
  });
}
