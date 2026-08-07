import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';

export const tagsRepository = {
  // Tags with how many blogs use each, most-used first, then alphabetical.
  // Optional case-insensitive substring filter for autocomplete.
  async listWithCounts({ search, limit }: { search?: string; limit: number }) {
    const where: Prisma.TagWhereInput = search
      ? { name: { contains: search, mode: 'insensitive' } }
      : {};

    const tags = await prisma.tag.findMany({
      where,
      take: limit,
      orderBy: [{ blogs: { _count: 'desc' } }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        _count: { select: { blogs: true } },
      },
    });

    return tags.map((t) => ({ id: t.id, name: t.name, blogCount: t._count.blogs }));
  },
};
