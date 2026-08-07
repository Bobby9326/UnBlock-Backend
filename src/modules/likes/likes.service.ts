import { Prisma } from '@prisma/client';
import { likesRepository } from './likes.repository.js';
import { blogsRepository } from '../blogs/blogs.repository.js';
import { notificationsService } from '../notifications/notifications.service.js';
import { AppError } from '../../utils/AppError.js';

export const likesService = {
  // Toggle like/unlike in one call. Duplicate likes are prevented at the DB
  // level by the UNIQUE(blog_id, user_id) constraint, which we lean on to stay
  // race-safe rather than relying on a check-then-insert alone.
  async toggle(blogId: string, userId: string): Promise<{ liked: boolean; count: number }> {
    const blog = await blogsRepository.findById(blogId);
    if (!blog) throw AppError.notFound('Blog not found');

    const existing = await likesRepository.find(blogId, userId);

    let liked: boolean;
    if (existing) {
      await likesRepository.delete(blogId, userId);
      liked = false;
    } else {
      try {
        await likesRepository.create(blogId, userId);
        liked = true;
      } catch (err) {
        // Concurrent double-like: unique violation → treat as already liked.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          liked = true;
        } else {
          throw err;
        }
      }
    }

    if (liked) {
      await notificationsService.notify({
        recipientId: blog.authorId,
        actorId: userId,
        type: 'like',
        referenceId: blogId,
        message: 'Someone liked your blog',
      });
    }

    const count = await likesRepository.countForBlog(blogId);
    return { liked, count };
  },
};
