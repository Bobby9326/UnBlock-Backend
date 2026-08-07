import type { Request, Response } from 'express';
import { notificationsService } from './notifications.service.js';
import { ok } from '../../utils/response.js';

export const notificationsController = {
  // GET — load list on dropdown open. Returns real is_read state.
  async list(req: Request, res: Response) {
    const notifications = await notificationsService.list(req.user!.id);
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    return ok(res, { notifications, unreadCount });
  },

  // PATCH read-all — called automatically right after GET.
  async readAll(req: Request, res: Response) {
    const result = await notificationsService.markAllRead(req.user!.id);
    return ok(res, result);
  },

  // DELETE — "Clear All" button. Soft delete (is_cleared=true).
  async clearAll(req: Request, res: Response) {
    const result = await notificationsService.clearAll(req.user!.id);
    return ok(res, result);
  },
};
