import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from '../zod.js';
import {
  updateProfileSchema,
  changePasswordSchema,
} from '../../modules/users/users.validation.js';
import { successSchema, userSchema, json, commonErrors } from '../helpers.js';

export function registerProfilePaths(registry: OpenAPIRegistry, _bearer: unknown): void {
  registry.registerPath({
    method: 'put',
    path: '/profile',
    tags: ['Profile'],
    summary: 'Update own username / avatar',
    security: [{ bearerAuth: [] }],
    request: { body: { content: json(updateProfileSchema.body) } },
    responses: {
      200: {
        description: 'Updated profile',
        content: json(successSchema(z.object({ user: userSchema }))),
      },
      ...commonErrors,
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/profile/password',
    tags: ['Profile'],
    summary: 'Change own password (requires current password)',
    security: [{ bearerAuth: [] }],
    request: { body: { content: json(changePasswordSchema.body) } },
    responses: {
      200: {
        description: 'Password changed',
        content: json(successSchema(z.object({ message: z.string() }))),
      },
      ...commonErrors,
    },
  });
}
