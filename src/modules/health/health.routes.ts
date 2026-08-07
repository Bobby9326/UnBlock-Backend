import { Router } from 'express';
import { healthController } from './health.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// Public, unauthenticated — meant for uptime monitors and platform health checks.
router.get('/', healthController.liveness); // GET /api/health
router.get('/db', asyncHandler(healthController.database)); // GET /api/health/db

export default router;
