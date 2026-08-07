import type { NotificationType } from '@prisma/client';
import { notificationsRepository } from './notifications.repository.js';

interface NotifyInput {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  referenceId?: string | null;
  message: string;
}

interface NotifyAdminsInput {
  type: NotificationType;
  referenceId?: string | null;
  message: string;
}

// Minimal blog shape attached to a notification for the dropdown thumbnail.
export interface NotificationBlog {
  id: string;
  title: string;
  coverImageUrl: string | null;
}

// Notification types that reference a blog via referenceId.
const BLOG_TYPES: ReadonlySet<NotificationType> = new Set([
  'comment',
  'reply',
  'like',
] as NotificationType[]);

// Pure join: attach `blog` to each notification from a fetched blog list.
// blog is null when the type isn't blog-related, referenceId is null, or the
// blog was deleted (so a single missing blog never breaks the list).
export function attachBlogs<
  T extends { type: NotificationType; referenceId: string | null },
>(notifications: T[], blogs: NotificationBlog[]): (T & { blog: NotificationBlog | null })[] {
  const byId = new Map(blogs.map((b) => [b.id, b]));
  return notifications.map((n) => ({
    ...n,
    blog:
      BLOG_TYPES.has(n.type) && n.referenceId ? byId.get(n.referenceId) ?? null : null,
  }));
}

export const notificationsService = {
  // GET list — returns is_read reflecting the real current state, with each
  // notification's related blog attached (batch-fetched, no N+1).
  async list(recipientId: string) {
    const notifications = await notificationsRepository.listForRecipient(recipientId);

    const blogIds = [
      ...new Set(
        notifications
          .filter((n) => BLOG_TYPES.has(n.type) && n.referenceId)
          .map((n) => n.referenceId as string),
      ),
    ];
    const blogs = await notificationsRepository.findBlogsByIds(blogIds);

    return attachBlogs(notifications, blogs);
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

  // Emit one notification to every super admin (e.g. a new registration).
  async notifyAdmins({ type, referenceId, message }: NotifyAdminsInput) {
    const adminIds = await notificationsRepository.findSuperAdminIds();
    return notificationsRepository.createMany(
      adminIds.map((recipientId) => ({
        recipientId,
        type,
        referenceId: referenceId ?? null,
        message,
      })),
    );
  },
};
