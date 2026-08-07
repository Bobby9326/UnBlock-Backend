import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';

export const notificationsRepository = {
  // Non-cleared notifications for a recipient, newest first.
  listForRecipient(recipientId: string) {
    return prisma.notification.findMany({
      where: { recipientId, isCleared: false },
      orderBy: { createdAt: 'desc' },
    });
  },

  markAllRead(recipientId: string) {
    return prisma.notification.updateMany({
      where: { recipientId, isRead: false, isCleared: false },
      data: { isRead: true },
    });
  },

  // Soft delete: hide from the list without removing the row.
  clearAll(recipientId: string) {
    return prisma.notification.updateMany({
      where: { recipientId, isCleared: false },
      data: { isCleared: true },
    });
  },

  create(data: Prisma.NotificationUncheckedCreateInput) {
    return prisma.notification.create({ data });
  },

  createMany(data: Prisma.NotificationUncheckedCreateInput[]) {
    if (!data.length) return Promise.resolve({ count: 0 });
    return prisma.notification.createMany({ data });
  },

  // Batch-fetch blogs referenced by a notification list (avoids N+1).
  findBlogsByIds(ids: string[]) {
    if (!ids.length) return Promise.resolve([]);
    return prisma.blog.findMany({
      where: { id: { in: ids } },
      select: { id: true, title: true, coverImageUrl: true },
    });
  },

  // Ids of all super admins — recipients for registration alerts.
  async findSuperAdminIds(): Promise<string[]> {
    const admins = await prisma.user.findMany({
      where: { role: 'super_admin' },
      select: { id: true },
    });
    return admins.map((a) => a.id);
  },
};
