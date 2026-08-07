import { prisma } from '../../config/database.js';

export const likesRepository = {
  find(blogId: string, userId: string) {
    return prisma.like.findUnique({
      where: { blogId_userId: { blogId, userId } },
    });
  },

  create(blogId: string, userId: string) {
    return prisma.like.create({ data: { blogId, userId } });
  },

  delete(blogId: string, userId: string) {
    return prisma.like.delete({
      where: { blogId_userId: { blogId, userId } },
    });
  },

  countForBlog(blogId: string) {
    return prisma.like.count({ where: { blogId } });
  },
};
