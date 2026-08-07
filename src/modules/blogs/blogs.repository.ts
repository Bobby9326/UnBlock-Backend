import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';

const authorSelect = {
  select: { id: true, username: true, avatarUrl: true },
} satisfies Prisma.BlogInclude['author'];

const blogInclude = {
  author: authorSelect,
  tags: { include: { tag: true } },
  _count: { select: { likes: true, comments: true } },
} satisfies Prisma.BlogInclude;

export type BlogWithRelations = Prisma.BlogGetPayload<{ include: typeof blogInclude }>;

export const blogsRepository = {
  // Paginated list with search/sort. Returns rows + total for meta.
  async list({
    where,
    orderBy,
    skip,
    take,
  }: {
    where: Prisma.BlogWhereInput;
    orderBy: Prisma.BlogOrderByWithRelationInput;
    skip: number;
    take: number;
  }): Promise<{ rows: BlogWithRelations[]; total: number }> {
    const [rows, total] = await Promise.all([
      prisma.blog.findMany({ where, orderBy, skip, take, include: blogInclude }),
      prisma.blog.count({ where }),
    ]);
    return { rows, total };
  },

  findById(id: string) {
    return prisma.blog.findUnique({ where: { id }, include: blogInclude });
  },

  // Which of these blog ids the user has liked.
  async likedBlogIds(userId: string | undefined, blogIds: string[]): Promise<Set<string>> {
    if (!userId || !blogIds.length) return new Set();
    const likes = await prisma.like.findMany({
      where: { userId, blogId: { in: blogIds } },
      select: { blogId: true },
    });
    return new Set(likes.map((l) => l.blogId));
  },

  create(data: Prisma.BlogCreateInput) {
    return prisma.blog.create({ data, include: blogInclude });
  },

  update(id: string, data: Prisma.BlogUpdateInput) {
    return prisma.blog.update({ where: { id }, data, include: blogInclude });
  },

  delete(id: string) {
    return prisma.blog.delete({ where: { id } });
  },

  // Upsert tags by name and return their ids.
  async upsertTags(names: string[]) {
    const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
    const tags = await Promise.all(
      unique.map((name) =>
        prisma.tag.upsert({ where: { name }, create: { name }, update: {} }),
      ),
    );
    return tags;
  },
};
