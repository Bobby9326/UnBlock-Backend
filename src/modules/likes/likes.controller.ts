import type { Request, Response } from 'express';
import { likesService } from './likes.service.js';
import { ok } from '../../utils/response.js';

export const likesController = {
  async toggle(req: Request, res: Response) {
    const result = await likesService.toggle(req.params.id as string, req.user!.id);
    return ok(res, result);
  },
};
