import type { Request, Response } from 'express';
import { blogsService } from './blogs.service.js';
import { ok, created } from '../../utils/response.js';
import type { ListBlogsQuery } from './blogs.validation.js';

export const blogsController = {
  async list(req: Request, res: Response) {
    const { items, meta } = await blogsService.list(
      req.validatedQuery as ListBlogsQuery,
      req.user,
    );
    return ok(res, items, meta);
  },

  async getById(req: Request, res: Response) {
    const blog = await blogsService.getById(req.params.id as string, req.user);
    return ok(res, { blog });
  },

  async create(req: Request, res: Response) {
    const blog = await blogsService.create(req.body, req.user!.id);
    return created(res, { blog });
  },

  async update(req: Request, res: Response) {
    const blog = await blogsService.update(req.params.id as string, req.body, req.user);
    return ok(res, { blog });
  },

  async remove(req: Request, res: Response) {
    const result = await blogsService.remove(req.params.id as string);
    return ok(res, result);
  },
};
