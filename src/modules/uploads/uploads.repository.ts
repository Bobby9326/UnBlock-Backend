import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';

export const uploadsRepository = {
  create(data: Prisma.UploadUncheckedCreateInput) {
    return prisma.upload.create({ data });
  },

  // Mark a set of objects (by storage path) as referenced — called when a blog
  // or avatar starts using them, so the cleanup job won't reap them.
  markReferencedByPaths(paths: string[]) {
    if (!paths.length) return Promise.resolve({ count: 0 });
    return prisma.upload.updateMany({
      where: { path: { in: paths } },
      data: { isReferenced: true },
    });
  },

  // Orphans: not referenced and older than the cutoff.
  findOrphans(cutoff: Date) {
    return prisma.upload.findMany({
      where: { isReferenced: false, createdAt: { lt: cutoff } },
    });
  },

  deleteByIds(ids: string[]) {
    if (!ids.length) return Promise.resolve({ count: 0 });
    return prisma.upload.deleteMany({ where: { id: { in: ids } } });
  },
};
