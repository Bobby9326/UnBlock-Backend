import type { Request, Response } from 'express';
import { commentsService } from './comments.service.js';
import { ok, created } from '../../utils/response.js';

export const commentsController = {
  async list(req: Request, res: Response) {
    const comments = await commentsService.listTree(req.params.id as string);
    return ok(res, { comments });
  },

  async create(req: Request, res: Response) {
    const comment = await commentsService.create(
      req.params.id as string,
      req.user!.id,
      req.body,
    );
    return created(res, { comment });
  },
};
