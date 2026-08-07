import { commentsRepository, type CommentWithUser } from './comments.repository.js';
import { blogsRepository } from '../blogs/blogs.repository.js';
import { notificationsService } from '../notifications/notifications.service.js';
import { AppError } from '../../utils/AppError.js';
import type { CreateCommentInput } from './comments.validation.js';

function shape(comment: CommentWithUser) {
  return {
    id: comment.id,
    content: comment.content,
    parentId: comment.parentId,
    user: comment.user,
    createdAt: comment.createdAt,
  };
}

type CommentNode = ReturnType<typeof shape> & { replies: ReturnType<typeof shape>[] };

export const commentsService = {
  // Returns a nested tree: root comments each with a replies[] array (1 level).
  async listTree(blogId: string): Promise<CommentNode[]> {
    const blog = await blogsRepository.findById(blogId);
    if (!blog) throw AppError.notFound('Blog not found');

    const flat = await commentsRepository.listForBlog(blogId);

    const roots: CommentNode[] = [];
    const byId = new Map<string, CommentNode>();

    for (const c of flat) {
      if (c.parentId === null) {
        const node: CommentNode = { ...shape(c), replies: [] };
        byId.set(c.id, node);
        roots.push(node);
      }
    }
    for (const c of flat) {
      if (c.parentId !== null) {
        const parent = byId.get(c.parentId);
        // Defensive: if a parent is somehow missing, skip rather than crash.
        if (parent) parent.replies.push(shape(c));
      }
    }
    return roots;
  },

  async create(blogId: string, userId: string, { content, parentId }: CreateCommentInput) {
    const blog = await blogsRepository.findById(blogId);
    if (!blog) throw AppError.notFound('Blog not found');

    let notifyType: 'comment' | 'reply' = 'comment';
    let recipientId = blog.authorId;

    if (parentId) {
      const parent = await commentsRepository.findById(parentId);
      if (!parent) throw AppError.notFound('Parent comment not found');
      // Parent must belong to this blog.
      if (parent.blogId !== blogId) {
        throw AppError.badRequest('Parent comment does not belong to this blog');
      }
      // Enforce single-level nesting: you may only reply to a ROOT comment.
      if (parent.parentId !== null) {
        throw AppError.badRequest('Cannot reply to a reply — replies are limited to one level');
      }
      notifyType = 'reply';
      recipientId = parent.userId; // notify the comment author, not the blog author
    }

    const comment = await commentsRepository.create({
      blogId,
      userId,
      parentId: parentId ?? null,
      content,
    });

    // Fire-and-forget notification (never notify yourself).
    await notificationsService.notify({
      recipientId,
      actorId: userId,
      type: notifyType,
      referenceId: blogId,
      message:
        notifyType === 'reply'
          ? `${comment.user.username} replied to your comment`
          : `${comment.user.username} commented on your blog`,
    });

    return shape(comment);
  },
};
