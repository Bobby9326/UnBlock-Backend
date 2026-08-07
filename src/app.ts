import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env.js';
import { isAllowedOrigin } from './utils/cors.js';
import apiRoutes from './routes/index.js';
import { buildOpenApiDocument } from './docs/openapi.js';
import { errorMiddleware, notFoundMiddleware } from './middlewares/error.middleware.js';

export function createApp(): Express {
  const app = express();

  // Credentialed CORS: the browser only sends the httpOnly auth cookie when the
  // response reflects the exact origin (no wildcard) and allows credentials.
  // Each CORS_ORIGINS entry is either an exact origin or a wildcard pattern
  // like "https://*.vercel.app" (matches Vercel preview subdomains).
  app.use(
    cors({
      origin(origin, cb) {
        // Allow non-browser clients (curl/Postman: no Origin header).
        // For a disallowed browser origin, resolve false rather than throwing:
        // the response simply omits CORS headers and the browser blocks it,
        // instead of surfacing a 500 from the error middleware.
        cb(null, !origin || isAllowedOrigin(origin, env.corsOrigins));
      },
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Uploaded files live in Supabase Storage and are served from its public
  // URL directly — no local static route needed.

  // ── API docs (Swagger UI) ───────────────────────────────
  const openapiDoc = buildOpenApiDocument();
  // Raw spec for tooling / client-code generation.
  app.get('/api/docs.json', (_req: Request, res: Response) => res.json(openapiDoc));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc, { customSiteTitle: 'UnBlock API' }));

  app.use('/api', apiRoutes);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
