import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from '../zod.js';
import { successSchema, notificationSchema, json, commonErrors } from '../helpers.js';

export function registerNotificationPaths(registry: OpenAPIRegistry, _bearer: unknown): void {
  registry.registerPath({
    method: 'get',
    path: '/notifications',
    tags: ['Notifications'],
    summary: 'List notifications (real is_read state)',
    description: 'Call this BEFORE read-all so the user sees which items are new.',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Notifications + unread count',
        content: json(
          successSchema(
            z.object({
              notifications: z.array(notificationSchema),
              unreadCount: z.number().int(),
            }),
          ),
        ),
      },
      ...commonErrors,
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/notifications/read-all',
    tags: ['Notifications'],
    summary: 'Mark all as read (called right after GET)',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Count marked read',
        content: json(successSchema(z.object({ updated: z.number().int() }))),
      },
      ...commonErrors,
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/notifications',
    tags: ['Notifications'],
    summary: 'Clear all (soft delete — is_cleared=true)',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Count cleared',
        content: json(successSchema(z.object({ cleared: z.number().int() }))),
      },
      ...commonErrors,
    },
  });
}
