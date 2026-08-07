import { Prisma } from '@prisma/client';
import { adminRepository } from './admin.repository.js';
import { uploadsRepository } from '../uploads/uploads.repository.js';
import { hashPassword } from '../../utils/hash.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';
import { AppError } from '../../utils/AppError.js';
import type { ListUsersQuery, ListBlogsQuery, UpdateUserInput } from './admin.validation.js';

const USER_SORT: Record<string, Prisma.UserOrderByWithRelationInput> = {
  newest: { createdAt: 'desc' },
  oldest: { createdAt: 'asc' },
  username: { username: 'asc' },
};

const BLOG_SORT: Record<string, Prisma.BlogOrderByWithRelationInput> = {
  newest: { createdAt: 'desc' },
  oldest: { createdAt: 'asc' },
  title: { title: 'asc' },
  most_liked: { likes: { _count: 'desc' } },
};

export const adminService = {
  async listUsers({ search, status, role, sort = 'newest', page, limit }: ListUsersQuery) {
    const { skip, take, page: p, limit: l } = parsePagination({ page, limit });

    const where: Prisma.UserWhereInput = {};
    if (status) where.status = status;
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const { rows, total } = await adminRepository.listUsers({
      where,
      orderBy: USER_SORT[sort] ?? USER_SORT.newest!,
      skip,
      take,
    });
    return { items: rows, meta: buildMeta({ page: p, limit: l, total }) };
  },

  async activateUser(id: string) {
    await adminService.assertUserExists(id);
    return adminRepository.updateUser(id, { status: 'active' });
  },

  async disableUser(id: string, actingAdminId: string) {
    const user = await adminService.assertUserExists(id);
    // Guard: an admin cannot disable their own account (lockout protection).
    if (id === actingAdminId) {
      throw AppError.badRequest('You cannot disable your own account');
    }
    if (user.status === 'disabled') return user;
    return adminRepository.updateUser(id, { status: 'disabled' });
  },

  async updateUser(id: string, patch: UpdateUserInput, actingAdminId: string) {
    await adminService.assertUserExists(id);
    // Prevent an admin from demoting themselves and losing admin access.
    if (id === actingAdminId && patch.role && patch.role !== 'super_admin') {
      throw AppError.badRequest('You cannot change your own role');
    }

    const user = await adminRepository.updateUser(id, patch);

    // Keep an admin-set avatar (storage path) from being reaped by cleanup.
    if (patch.avatarUrl) {
      await uploadsRepository.markReferencedByPaths([patch.avatarUrl]);
    }

    return user;
  },

  // Admin reset — no current-password check (that's the /profile flow).
  async resetPassword(id: string, newPassword: string) {
    await adminService.assertUserExists(id);
    const passwordHash = await hashPassword(newPassword);
    await adminRepository.updateUserPasswordHash(id, passwordHash);
    return { message: 'Password has been reset' };
  },

  async deleteUser(id: string, actingAdminId: string) {
    await adminService.assertUserExists(id);
    if (id === actingAdminId) {
      throw AppError.badRequest('You cannot delete your own account');
    }
    await adminRepository.deleteUser(id);
    return { message: 'User deleted' };
  },

  async listBlogs({ search, status, authorId, sort = 'newest', page, limit }: ListBlogsQuery) {
    const { skip, take, page: p, limit: l } = parsePagination({ page, limit });

    const where: Prisma.BlogWhereInput = {};
    if (status) where.status = status;
    if (authorId) where.authorId = authorId;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const { rows, total } = await adminRepository.listBlogs({
      where,
      orderBy: BLOG_SORT[sort] ?? BLOG_SORT.newest!,
      skip,
      take,
    });

    const items = rows.map((b) => ({
      id: b.id,
      title: b.title,
      status: b.status,
      author: b.author,
      coverImageUrl: b.coverImageUrl,
      likeCount: b._count.likes,
      commentCount: b._count.comments,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }));

    return { items, meta: buildMeta({ page: p, limit: l, total }) };
  },

  async assertUserExists(id: string) {
    const user = await adminRepository.findUserById(id);
    if (!user) throw AppError.notFound('User not found');
    return user;
  },
};
