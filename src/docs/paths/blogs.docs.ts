import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from '../zod.js';
import {
  listBlogsSchema,
  idParamSchema,
  createBlogSchema,
  updateBlogSchema,
} from '../../modules/blogs/blogs.validation.js';
import { successSchema, listSchema, blogSchema, json, commonErrors } from '../helpers.js';

export function registerBlogPaths(registry: OpenAPIRegistry, _bearer: unknown): void {
  registry.registerPath({
    method: 'get',
    path: '/blogs',
    tags: ['Blogs'],
    summary: 'List published blogs (search / sort / paginate)',
    security: [{ bearerAuth: [] }],
    request: { query: listBlogsSchema.query },
    responses: {
      200: { description: 'Paginated blogs', content: json(listSchema(blogSchema)) },
      ...commonErrors,
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/blogs/{id}',
    tags: ['Blogs'],
    summary: 'Get a blog by id',
    security: [{ bearerAuth: [] }],
    request: { params: idParamSchema.params },
    responses: {
      200: {
        description: 'Blog detail',
        content: json(successSchema(z.object({ blog: blogSchema }))),
      },
      ...commonErrors,
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/blogs',
    tags: ['Blogs'],
    summary: 'Create a blog',
    security: [{ bearerAuth: [] }],
    request: { body: { content: json(createBlogSchema.body) } },
    responses: {
      201: {
        description: 'Created blog',
        content: json(successSchema(z.object({ blog: blogSchema }))),
      },
      ...commonErrors,
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/blogs/{id}',
    tags: ['Blogs'],
    summary: 'Update a blog (owner only)',
    security: [{ bearerAuth: [] }],
    request: { params: idParamSchema.params, body: { content: json(updateBlogSchema.body) } },
    responses: {
      200: {
        description: 'Updated blog',
        content: json(successSchema(z.object({ blog: blogSchema }))),
      },
      ...commonErrors,
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/blogs/{id}',
    tags: ['Blogs'],
    summary: 'Delete a blog (owner or super admin)',
    security: [{ bearerAuth: [] }],
    request: { params: idParamSchema.params },
    responses: {
      200: {
        description: 'Deleted',
        content: json(successSchema(z.object({ message: z.string() }))),
      },
      ...commonErrors,
    },
  });
}
