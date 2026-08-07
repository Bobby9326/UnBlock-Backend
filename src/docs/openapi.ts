import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
// Importing this first applies extendZodWithOpenApi before any docs schema loads.
import './zod.js';
import { env } from '../config/env.js';

import { registerHealthPaths } from './paths/health.docs.js';
import { registerAuthPaths } from './paths/auth.docs.js';
import { registerProfilePaths } from './paths/profile.docs.js';
import { registerBlogPaths } from './paths/blogs.docs.js';
import { registerCommentPaths } from './paths/comments.docs.js';
import { registerLikePaths } from './paths/likes.docs.js';
import { registerNotificationPaths } from './paths/notifications.docs.js';
import { registerUploadPaths } from './paths/uploads.docs.js';
import { registerTagPaths } from './paths/tags.docs.js';
import { registerAdminPaths } from './paths/admin.docs.js';

export function buildOpenApiDocument() {
  const registry = new OpenAPIRegistry();

  // ── Shared security scheme: Bearer JWT ──────────────────
  const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  });

  // Browser clients authenticate via the httpOnly cookie set on login.
  registry.registerComponent('securitySchemes', 'cookieAuth', {
    type: 'apiKey',
    in: 'cookie',
    name: env.authCookieName,
  });

  // Each module registers its own operations.
  registerHealthPaths(registry);
  registerAuthPaths(registry, bearerAuth);
  registerProfilePaths(registry, bearerAuth);
  registerBlogPaths(registry, bearerAuth);
  registerCommentPaths(registry, bearerAuth);
  registerLikePaths(registry, bearerAuth);
  registerNotificationPaths(registry, bearerAuth);
  registerUploadPaths(registry, bearerAuth);
  registerTagPaths(registry, bearerAuth);
  registerAdminPaths(registry, bearerAuth);

  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'UnBlock API',
      version: '1.0.0',
      description:
        'Blog management system API. All protected routes require a Bearer JWT ' +
        'obtained from `POST /api/auth/login`.',
    },
    servers: [{ url: '/api', description: 'API base path' }],
    tags: [
      { name: 'Health', description: 'Liveness & readiness probes' },
      { name: 'Auth', description: 'Registration, login, session' },
      { name: 'Profile', description: 'Self profile & password' },
      { name: 'Blogs', description: 'Blog CRUD, search, sort, pagination' },
      { name: 'Comments', description: 'Comments and one-level replies' },
      { name: 'Likes', description: 'Toggle like/unlike' },
      { name: 'Notifications', description: 'Notification list & state' },
      { name: 'Uploads', description: 'Image upload to Supabase Storage' },
      { name: 'Tags', description: 'Tag list for filtering & autocomplete' },
      { name: 'Admin', description: 'User & blog management (super admin)' },
    ],
  });
}
