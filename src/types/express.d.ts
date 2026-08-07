import type { AuthUser } from './index.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
      // Parsed query params from the validate() middleware (Zod output).
      validatedQuery?: unknown;
    }
  }
}

export {};
