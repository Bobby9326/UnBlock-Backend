import { Prisma } from '@prisma/client';
import { blogsRepository, type BlogWithRelations } from './blogs.repository.js';
import { uploadsRepository } from '../uploads/uploads.repository.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';
import { normalizeTag } from '../../utils/tag.js';
import { AppError } from '../../utils/AppError.js';
import type { AuthUser } from '../../types/index.js';
import type { ListBlogsQuery, CreateBlogInput, UpdateBlogInput } from './blogs.validation.js';

// A minimal structural view of a ProseMirror node for traversal.
interface ProseMirrorNode {
  type?: string;
  attrs?: { src?: unknown };
  content?: ProseMirrorNode[];
}

// Walk a ProseMirror/Tiptap doc and collect every image src plus the cover.
// With the private bucket these values are storage PATHS, not URLs.
export function collectImagePaths(content: unknown, coverImagePath?: string | null): string[] {
  const paths = new Set<string>();
  if (coverImagePath) paths.add(coverImagePath);

  const visit = (node: ProseMirrorNode | null | undefined): void => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'image' && node.attrs && typeof node.attrs.src === 'string') {
      paths.add(node.attrs.src);
    }
    if (Array.isArray(node.content)) node.content.forEach(visit);
  };
  visit(content as ProseMirrorNode);
  return [...paths];
}

// Shape a blog row for the API, folding in like_count / is_liked_by_me.
function present(blog: BlogWithRelations, likedSet?: Set<string>) {
  return {
    id: blog.id,
    title: blog.title,
    content: blog.content,
    coverImageUrl: blog.coverImageUrl,
    status: blog.status,
    author: blog.author,
    tags: blog.tags.map((t) => t.tag.name),
    likeCount: blog._count.likes,
    commentCount: blog._count.comments,
    isLikedByMe: likedSet ? likedSet.has(blog.id) : false,
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt,
  };
}

const SORT_MAP: Record<
  string,
  Prisma.BlogOrderByWithRelationInput | Prisma.BlogOrderByWithRelationInput[]
> = {
  newest: { createdAt: 'desc' },
  oldest: { createdAt: 'asc' },
  title: { title: 'asc' },
  // Tiebreaker: most likes → most comments → newest. Prevents unstable
  // ordering when multiple blogs share the same like count.
  most_liked: [
    { likes: { _count: 'desc' } },
    { comments: { _count: 'desc' } },
    { createdAt: 'desc' },
  ],
};

// Build the Prisma `where` for a blog listing, enforcing visibility rules.
// SECURITY: only `author='me'` may see drafts, and only the caller's own.
// Public browsing is pinned to published regardless of the `status` param, so
// other users' drafts can never leak.
export function buildListWhere(
  { search, tag, status, author }: Pick<ListBlogsQuery, 'search' | 'tag' | 'status' | 'author'>,
  currentUser?: AuthUser,
): Prisma.BlogWhereInput {
  const where: Prisma.BlogWhereInput = {};
  if (search) where.title = { contains: search, mode: 'insensitive' };
  if (tag) where.tags = { some: { tag: { name: normalizeTag(tag) } } };

  if (author === 'me') {
    if (!currentUser) throw AppError.unauthorized();
    where.authorId = currentUser.id;
    if (status) where.status = status;
  } else {
    where.status = 'published';
  }
  return where;
}

export const blogsService = {
  async list(
    { search, tag, status, author, sort = 'newest', page, limit }: ListBlogsQuery,
    currentUser?: AuthUser,
  ) {
    const { skip, take, page: p, limit: l } = parsePagination({ page, limit });

    const where = buildListWhere({ search, tag, status, author }, currentUser);
    const orderBy = SORT_MAP[sort] ?? SORT_MAP.newest!;

    const { rows, total } = await blogsRepository.list({ where, orderBy, skip, take });
    const likedSet = await blogsRepository.likedBlogIds(
      currentUser?.id,
      rows.map((r) => r.id),
    );

    return {
      items: rows.map((b) => present(b, likedSet)),
      meta: buildMeta({ page: p, limit: l, total }),
    };
  },

  async getById(id: string, currentUser?: AuthUser) {
    const blog = await blogsRepository.findById(id);
    if (!blog) throw AppError.notFound('Blog not found');

    // Hide drafts from everyone but the author and super admins.
    if (blog.status === 'draft') {
      const isAuthor = currentUser?.id === blog.authorId;
      const isSuperAdmin = currentUser?.role === 'super_admin';
      if (!isAuthor && !isSuperAdmin) throw AppError.notFound('Blog not found');
    }

    const likedSet = await blogsRepository.likedBlogIds(currentUser?.id, [blog.id]);
    return present(blog, likedSet);
  },

  async create(
    { title, content, coverImageUrl, status, tags }: CreateBlogInput,
    authorId: string,
  ) {
    const data: Prisma.BlogCreateInput = {
      title,
      content: content as Prisma.InputJsonValue,
      coverImageUrl: coverImageUrl ?? null,
      status: status ?? 'draft',
      author: { connect: { id: authorId } },
    };

    if (tags?.length) {
      const tagRecords = await blogsRepository.upsertTags(tags);
      data.tags = { create: tagRecords.map((t) => ({ tag: { connect: { id: t.id } } })) };
    }

    const blog = await blogsRepository.create(data);

    // Flag any uploaded images referenced by this blog so the cleanup job
    // won't reap them.
    await uploadsRepository.markReferencedByPaths(collectImagePaths(content, coverImageUrl));

    return present(blog, new Set());
  },

  async update(id: string, patch: UpdateBlogInput, currentUser?: AuthUser) {
    const existing = await blogsRepository.findById(id);
    if (!existing) throw AppError.notFound('Blog not found');

    const data: Prisma.BlogUpdateInput = {};
    if (patch.title !== undefined) data.title = patch.title;
    if (patch.content !== undefined) data.content = patch.content as Prisma.InputJsonValue;
    if (patch.coverImageUrl !== undefined) data.coverImageUrl = patch.coverImageUrl;
    if (patch.status !== undefined) data.status = patch.status;

    if (patch.tags !== undefined) {
      const tagRecords = patch.tags.length ? await blogsRepository.upsertTags(patch.tags) : [];
      // Replace the tag set wholesale.
      data.tags = {
        deleteMany: {},
        create: tagRecords.map((t) => ({ tag: { connect: { id: t.id } } })),
      };
    }

    const blog = await blogsRepository.update(id, data);

    const content = patch.content ?? existing.content;
    const cover =
      patch.coverImageUrl !== undefined ? patch.coverImageUrl : existing.coverImageUrl;
    await uploadsRepository.markReferencedByPaths(collectImagePaths(content, cover));

    const likedSet = await blogsRepository.likedBlogIds(currentUser?.id, [blog.id]);
    return present(blog, likedSet);
  },

  async remove(id: string) {
    const existing = await blogsRepository.findById(id);
    if (!existing) throw AppError.notFound('Blog not found');
    await blogsRepository.delete(id);
    return { message: 'Blog deleted' };
  },
};
