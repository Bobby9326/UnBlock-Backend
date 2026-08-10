import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { publicUserSelect } from '../auth/auth.repository.js';

const authorSelect = { select: { id: true, username: true, avatarUrl: true } };

const adminBlogInclude = {
  author: authorSelect,
  _count: { select: { likes: true, comments: true } },
} satisfies Prisma.BlogInclude;

export type AdminBlogRow = Prisma.BlogGetPayload<{ include: typeof adminBlogInclude }>;

export const adminRepository = {
  async listUsers({
    where,
    orderBy,
    skip,
    take,
  }: {
    where: Prisma.UserWhereInput;
    orderBy: Prisma.UserOrderByWithRelationInput;
    skip: number;
    take: number;
  }) {
    const [rows, total] = await Promise.all([
      prisma.user.findMany({ where, orderBy, skip, take, select: publicUserSelect }),
      prisma.user.count({ where }),
    ]);
    return { rows, total };
  },

  findUserById(id: string) {
    return prisma.user.findUnique({ where: { id }, select: publicUserSelect });
  },

  updateUser(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data, select: publicUserSelect });
  },

  updateUserPasswordHash(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { passwordHash },
      select: { id: true },
    });
  },

  deleteUser(id: string) {
    return prisma.user.delete({ where: { id } });
  },

  async listBlogs({
    where,
    orderBy,
    skip,
    take,
  }: {
    where: Prisma.BlogWhereInput;
    orderBy: Prisma.BlogOrderByWithRelationInput | Prisma.BlogOrderByWithRelationInput[];
    skip: number;
    take: number;
  }): Promise<{ rows: AdminBlogRow[]; total: number }> {
    const [rows, total] = await Promise.all([
      prisma.blog.findMany({ where, orderBy, skip, take, include: adminBlogInclude }),
      prisma.blog.count({ where }),
    ]);
    return { rows, total };
  },
};
