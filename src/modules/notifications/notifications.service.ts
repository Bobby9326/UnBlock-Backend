import type { NotificationType } from '@prisma/client';
import { notificationsRepository } from './notifications.repository.js';

interface NotifyInput {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  referenceId?: string | null;
  message: string;
}

export const notificationsService = {
  // GET list — returns is_read reflecting the real current state.
  // Deliberately does NOT mutate anything; the frontend calls read-all
  // separately, right after, so the user sees which items were new.
  list(recipientId: string) {
    return notificationsRepository.listForRecipient(recipientId);
  },

  async markAllRead(recipientId: string) {
    const result = await notificationsRepository.markAllRead(recipientId);
    return { updated: result.count };
  },

  async clearAll(recipientId: string) {
    const result = await notificationsRepository.clearAll(recipientId);
    return { cleared: result.count };
  },

  // Internal helper used by other modules to emit a notification.
  // Never notifies a user about their own action.
  async notify({ recipientId, actorId, type, referenceId, message }: NotifyInput) {
    if (recipientId === actorId) return null;
    return notificationsRepository.create({
      recipientId,
      type,
      referenceId: referenceId ?? null,
      message,
    });
  },
};
