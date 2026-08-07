import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { publicUserSelect } from '../auth/auth.repository.js';

export const usersRepository = {
  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data, select: publicUserSelect });
  },

  updatePasswordHash(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { passwordHash },
      select: { id: true },
    });
  },
};
