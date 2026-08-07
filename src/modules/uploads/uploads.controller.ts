import type { Request, Response } from 'express';
import { uploadsService } from './uploads.service.js';
import { created } from '../../utils/response.js';

export const uploadsController = {
  async upload(req: Request, res: Response) {
    const result = await uploadsService.registerUpload({
      file: req.file!,
      uploaderId: req.user!.id,
    });
    return created(res, result);
  },
};
