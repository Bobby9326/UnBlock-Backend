import { test } from 'node:test';
import assert from 'node:assert/strict';

import { normalizeTag, normalizeTags } from '../src/utils/tag.js';

test('normalizeTag lowercases, trims, collapses whitespace', () => {
  assert.equal(normalizeTag('  React '), 'react');
  assert.equal(normalizeTag('React'), 'react');
  assert.equal(normalizeTag('REACT'), 'react');
  assert.equal(normalizeTag('React   JS'), 'react js');
  assert.equal(normalizeTag('node\tjs'), 'node js');
});

test('normalizeTag makes variants collapse to one value', () => {
  const canonical = normalizeTag('nodejs');
  assert.equal(normalizeTag('NodeJS'), canonical);
  assert.equal(normalizeTag(' nodejs  '), canonical);
});

test('normalizeTags dedupes case/space variants, preserves order', () => {
  assert.deepEqual(normalizeTags(['React', 'react', ' REACT ']), ['react']);
  assert.deepEqual(normalizeTags(['TypeScript', 'Node', 'node', 'typescript']), [
    'typescript',
    'node',
  ]);
});

test('normalizeTags drops empty / whitespace-only entries', () => {
  assert.deepEqual(normalizeTags(['', '   ', 'prisma']), ['prisma']);
  assert.deepEqual(normalizeTags([]), []);
});
