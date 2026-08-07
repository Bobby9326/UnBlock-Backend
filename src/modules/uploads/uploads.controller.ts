import type { Request, Response } from 'express';
import { uploadsService } from './uploads.service.js';
import { ok, created } from '../../utils/response.js';
import type { SignInput } from './uploads.validation.js';

export const uploadsController = {
  async upload(req: Request, res: Response) {
    const result = await uploadsService.registerUpload({
      file: req.file!,
      uploaderId: req.user!.id,
    });
    return created(res, result);
  },

  // Resolve stored paths → signed URLs for viewing. Returns a { path: url } map.
  async sign(req: Request, res: Response) {
    const { paths } = req.body as SignInput;
    const results = await uploadsService.signPaths(paths);
    const urls = Object.fromEntries(results.map((r) => [r.path, r.url]));
    return ok(res, { urls });
  },
};
