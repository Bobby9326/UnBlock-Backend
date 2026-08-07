import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';

export const publicUserSelect = {
  id: true,
  username: true,
  email: true,
  role: true,
  status: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export const authRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id }, select: publicUserSelect });
  },

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data, select: publicUserSelect });
  },
};
