import type { Request, Response } from 'express';
import { usersService } from './users.service.js';
import { ok } from '../../utils/response.js';

export const usersController = {
  async updateProfile(req: Request, res: Response) {
    const user = await usersService.updateProfile(req.user!.id, req.body);
    return ok(res, { user });
  },

  async changePassword(req: Request, res: Response) {
    const result = await usersService.changePassword(req.user!.id, req.body);
    return ok(res, result);
  },
};
