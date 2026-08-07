import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';

export const uploadsRepository = {
  create(data: Prisma.UploadUncheckedCreateInput) {
    return prisma.upload.create({ data });
  },

  findByUrls(urls: string[]) {
    return prisma.upload.findMany({ where: { url: { in: urls } } });
  },

  // Mark a set of URLs as referenced (called when a blog references them).
  markReferencedByUrls(urls: string[]) {
    if (!urls.length) return Promise.resolve({ count: 0 });
    return prisma.upload.updateMany({
      where: { url: { in: urls } },
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
