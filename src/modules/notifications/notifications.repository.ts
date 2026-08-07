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
};
