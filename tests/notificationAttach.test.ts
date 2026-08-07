import { test } from 'node:test';
import assert from 'node:assert/strict';

import { attachBlogs } from '../src/modules/notifications/notifications.service.js';

const blog = { id: 'blog-1', title: 'Hello', coverImageUrl: 'u/1.png' };

test('attaches the blog for blog-related types', () => {
  const out = attachBlogs(
    [{ type: 'comment', referenceId: 'blog-1' }],
    [blog],
  );
  assert.deepEqual(out[0]!.blog, blog);
});

test('like and reply also resolve their blog', () => {
  const out = attachBlogs(
    [
      { type: 'like', referenceId: 'blog-1' },
      { type: 'reply', referenceId: 'blog-1' },
    ],
    [blog],
  );
  assert.equal(out[0]!.blog?.id, 'blog-1');
  assert.equal(out[1]!.blog?.id, 'blog-1');
});

test('blog is null for non-blog types (system / user_registered)', () => {
  const out = attachBlogs(
    [
      { type: 'system', referenceId: null },
      { type: 'user_registered', referenceId: 'user-9' },
    ],
    [blog],
  );
  assert.equal(out[0]!.blog, null);
  assert.equal(out[1]!.blog, null); // referenceId is a userId, not a blog
});

test('blog is null when the referenced blog was deleted (missing from list)', () => {
  const out = attachBlogs(
    [{ type: 'comment', referenceId: 'gone' }],
    [blog], // 'gone' not present
  );
  assert.equal(out[0]!.blog, null);
});

test('one missing blog does not affect the others', () => {
  const out = attachBlogs(
    [
      { type: 'comment', referenceId: 'blog-1' },
      { type: 'like', referenceId: 'gone' },
    ],
    [blog],
  );
  assert.equal(out[0]!.blog?.id, 'blog-1');
  assert.equal(out[1]!.blog, null);
});
