import { test } from 'node:test';
import assert from 'node:assert/strict';

import { collectImageUrls } from '../src/modules/blogs/blogs.service.js';
import { parsePagination, buildMeta } from '../src/utils/pagination.js';

// These tests exercise pure logic and require no database.

test('collectImageUrls walks a ProseMirror doc and includes the cover', () => {
  const doc = {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'hello' }] },
      { type: 'image', attrs: { src: 'http://x/a.png' } },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'more' },
          { type: 'image', attrs: { src: 'http://x/b.png' } },
        ],
      },
    ],
  };
  const urls = collectImageUrls(doc, 'http://x/cover.png').sort();
  assert.deepEqual(urls, ['http://x/a.png', 'http://x/b.png', 'http://x/cover.png']);
});

test('collectImageUrls handles empty content and no cover', () => {
  assert.deepEqual(collectImageUrls({ type: 'doc', content: [] }, null), []);
});

test('parsePagination applies defaults and clamps', () => {
  assert.deepEqual(parsePagination({}), { page: 1, limit: 10, skip: 0, take: 10 });
  assert.deepEqual(parsePagination({ page: '3', limit: '5' }), {
    page: 3,
    limit: 5,
    skip: 10,
    take: 5,
  });
  assert.equal(parsePagination({ limit: '9999' }).limit, 100);
  assert.equal(parsePagination({ page: '-2' }).page, 1);
});

test('buildMeta computes totalPages', () => {
  assert.deepEqual(buildMeta({ page: 1, limit: 10, total: 25 }), {
    page: 1,
    limit: 10,
    total: 25,
    totalPages: 3,
  });
  assert.equal(buildMeta({ page: 1, limit: 10, total: 0 }).totalPages, 1);
});
