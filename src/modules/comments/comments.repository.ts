import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';

const userSelect = { select: { id: true, username: true, avatarUrl: true } };

const commentInclude = { user: userSelect } satisfies Prisma.CommentInclude;

export type CommentWithUser = Prisma.CommentGetPayload<{ include: typeof commentInclude }>;

export const commentsRepository = {
  // All comments for a blog, flat, oldest first. The service assembles the tree.
  listForBlog(blogId: string): Promise<CommentWithUser[]> {
    return prisma.comment.findMany({
      where: { blogId },
      orderBy: { createdAt: 'asc' },
      include: commentInclude,
    });
  },

  findById(id: string) {
    return prisma.comment.findUnique({ where: { id } });
  },

  create(data: Prisma.CommentUncheckedCreateInput): Promise<CommentWithUser> {
    return prisma.comment.create({ data, include: commentInclude });
  },

  delete(id: string) {
    return prisma.comment.delete({ where: { id } });
  },
};
