import type { Request, Response } from 'express';
import { adminService } from './admin.service.js';
import { ok } from '../../utils/response.js';
import type { ListUsersQuery, ListBlogsQuery } from './admin.validation.js';

export const adminController = {
  // ── Users ──────────────────────────────────────────────
  async listUsers(req: Request, res: Response) {
    const { items, meta } = await adminService.listUsers(req.validatedQuery as ListUsersQuery);
    return ok(res, items, meta);
  },

  async activateUser(req: Request, res: Response) {
    const user = await adminService.activateUser(req.params.id as string);
    return ok(res, { user });
  },

  async disableUser(req: Request, res: Response) {
    const user = await adminService.disableUser(req.params.id as string, req.user!.id);
    return ok(res, { user });
  },

  async updateUser(req: Request, res: Response) {
    const user = await adminService.updateUser(req.params.id as string, req.body, req.user!.id);
    return ok(res, { user });
  },

  async resetPassword(req: Request, res: Response) {
    const result = await adminService.resetPassword(req.params.id as string, req.body.newPassword);
    return ok(res, result);
  },

  async deleteUser(req: Request, res: Response) {
    const result = await adminService.deleteUser(req.params.id as string, req.user!.id);
    return ok(res, result);
  },

  // ── Blogs ──────────────────────────────────────────────
  async listBlogs(req: Request, res: Response) {
    const { items, meta } = await adminService.listBlogs(req.validatedQuery as ListBlogsQuery);
    return ok(res, items, meta);
  },
};
