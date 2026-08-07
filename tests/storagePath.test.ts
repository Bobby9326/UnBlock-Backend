import { test } from 'node:test';
import assert from 'node:assert/strict';

import { storagePathSchema } from '../src/utils/storagePath.js';

const ok = (v: string) => storagePathSchema.safeParse(v).success;

test('accepts upload-style storage paths', () => {
  assert.equal(ok('3f9a2b1c-8d7e-4f6a-9c1b-2e5d8a0f7b3c/a1b2c3.png'), true);
  assert.equal(ok('user-1/cover.webp'), true);
});

test('rejects full URLs (a leaked signed/public link)', () => {
  assert.equal(ok('https://x.supabase.co/storage/v1/object/public/uploads/a.png'), false);
  assert.equal(ok('http://evil.com/a.png'), false);
});

test('rejects path traversal / absolute paths', () => {
  assert.equal(ok('../secrets/key.png'), false);
  assert.equal(ok('/etc/passwd'), false);
  assert.equal(ok('a/../../b.png'), false);
});

test('rejects empty', () => {
  assert.equal(ok(''), false);
  assert.equal(ok('   '), false);
});
