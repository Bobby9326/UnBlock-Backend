import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from '../zod.js';
import { registerSchema, loginSchema } from '../../modules/auth/auth.validation.js';
import { successSchema, userSchema, json, commonErrors, errorSchema } from '../helpers.js';

export function registerAuthPaths(registry: OpenAPIRegistry, _bearer: unknown): void {
  registry.registerPath({
    method: 'post',
    path: '/auth/register',
    tags: ['Auth'],
    summary: 'Register a new account (status = pending)',
    request: { body: { content: json(registerSchema.body) } },
    responses: {
      201: {
        description: 'Registered; awaiting admin approval',
        content: json(
          successSchema(z.object({ user: userSchema, message: z.string() })),
        ),
      },
      409: { description: 'Email already registered', content: json(errorSchema) },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/auth/login',
    tags: ['Auth'],
    summary: 'Log in and receive a JWT',
    request: { body: { content: json(loginSchema.body) } },
    responses: {
      200: {
        description: 'Authenticated',
        content: json(
          successSchema(z.object({ token: z.string(), user: userSchema.partial() })),
        ),
      },
      401: commonErrors[401],
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/auth/logout',
    tags: ['Auth'],
    summary: 'Log out (client discards token)',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Logged out',
        content: json(successSchema(z.object({ message: z.string() }))),
      },
      401: commonErrors[401],
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/auth/me',
    tags: ['Auth'],
    summary: 'Get the current user',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Current user',
        content: json(successSchema(z.object({ user: userSchema }))),
      },
      401: commonErrors[401],
    },
  });
}
