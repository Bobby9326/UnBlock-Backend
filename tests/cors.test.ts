import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isAllowedOrigin } from '../src/utils/cors.js';

test('exact origins match, others do not', () => {
  const allow = ['https://app.example.com', 'http://localhost:5173'];
  assert.equal(isAllowedOrigin('https://app.example.com', allow), true);
  assert.equal(isAllowedOrigin('http://localhost:5173', allow), true);
  assert.equal(isAllowedOrigin('https://evil.com', allow), false);
  // Scheme / port must match exactly.
  assert.equal(isAllowedOrigin('http://app.example.com', allow), false);
  assert.equal(isAllowedOrigin('http://localhost:3000', allow), false);
});

test('wildcard matches exactly one subdomain label', () => {
  const allow = ['https://*.vercel.app'];
  assert.equal(isAllowedOrigin('https://unblock.vercel.app', allow), true);
  assert.equal(isAllowedOrigin('https://unblock-git-main-me.vercel.app', allow), true);
  // Must NOT match nested labels or the bare apex.
  assert.equal(isAllowedOrigin('https://a.b.vercel.app', allow), false);
  assert.equal(isAllowedOrigin('https://vercel.app', allow), false);
});

test('wildcard does not let a lookalike domain through', () => {
  const allow = ['https://*.vercel.app'];
  // The dot before vercel.app is literal — evil-vercel.app must fail.
  assert.equal(isAllowedOrigin('https://x.evil-vercel.app', allow), false);
  assert.equal(isAllowedOrigin('https://vercel.app.evil.com', allow), false);
});
