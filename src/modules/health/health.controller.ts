import type { Request, Response } from 'express';
import { prisma } from '../../config/database.js';

export const healthController = {
  // Liveness: process is up. Cheap, no I/O — used to keep Render awake.
  liveness(_req: Request, res: Response) {
    return res.json({ success: true, data: { status: 'ok' } });
  },

  // Readiness: verifies the database is reachable. A lightweight `SELECT 1`
  // also counts as activity that keeps a free-tier Supabase project from
  // pausing. Returns 503 when the DB is unreachable so monitors can alert.
  async database(_req: Request, res: Response) {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return res.json({
        success: true,
        data: { status: 'ok', database: 'up', latencyMs: Date.now() - start },
      });
    } catch (err) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Database health check failed',
          detail: (err as Error).message,
        },
      });
    }
  },
};
