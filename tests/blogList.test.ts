import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildListWhere } from '../src/modules/blogs/blogs.service.js';
import type { AuthUser } from '../src/types/index.js';

const user: AuthUser = {
  id: 'user-1',
  username: 'u',
  email: 'u@x.com',
  role: 'general_user',
  status: 'active',
  avatarUrl: null,
};

test('public browsing is pinned to published', () => {
  assert.deepEqual(buildListWhere({}, user).status, 'published');
});

test('public browsing IGNORES ?status=draft (no draft leak)', () => {
  // The security-critical case: a public listing must never expose drafts.
  const where = buildListWhere({ status: 'draft' }, user);
  assert.equal(where.status, 'published');
  assert.equal(where.authorId, undefined);
});

test('author=me returns own drafts + published (no status filter)', () => {
  const where = buildListWhere({ author: 'me' }, user);
  assert.equal(where.authorId, 'user-1');
  assert.equal(where.status, undefined); // both draft and published
});

test('author=me with status narrows to own drafts', () => {
  const where = buildListWhere({ author: 'me', status: 'draft' }, user);
  assert.equal(where.authorId, 'user-1');
  assert.equal(where.status, 'draft');
});

test('author=me without a logged-in user is rejected', () => {
  assert.throws(() => buildListWhere({ author: 'me' }, undefined), /Authentication/);
});
