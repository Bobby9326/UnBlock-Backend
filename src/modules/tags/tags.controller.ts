import type { Request, Response } from 'express';
import { tagsService } from './tags.service.js';
import { ok } from '../../utils/response.js';
import type { ListTagsQuery } from './tags.validation.js';

export const tagsController = {
  async list(req: Request, res: Response) {
    const tags = await tagsService.list(req.validatedQuery as ListTagsQuery);
    return ok(res, { tags });
  },
};
