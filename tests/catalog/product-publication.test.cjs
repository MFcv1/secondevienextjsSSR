'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const admin = require('../../functions/node_modules/firebase-admin');

if (!admin.apps.length) admin.initializeApp({ projectId: 'demo-product-publication' });

const {
  ORIGINAL_PATH_PATTERN,
  buildMedia,
} = require('../../functions/src/publication/productPublication');

test('publication media is assembled in stable slot order and rejects incomplete sessions', () => {
  const slots = {
    'slot-01': {
      status: 'ready',
      variants: { full: 'https://example.test/second.webp', thumb384: 'https://example.test/second-384.webp' },
      metadata: { width: 1200, height: 1600 },
    },
    'slot-00': {
      status: 'ready',
      variants: { full: 'https://example.test/first.webp', thumb384: 'https://example.test/first-384.webp' },
      metadata: { width: 1200, height: 1600 },
    },
  };
  const media = buildMedia(slots, 2);
  assert.deepEqual(media.images, [
    'https://example.test/first.webp',
    'https://example.test/second.webp',
  ]);
  assert.equal(media.imageUrl, 'https://example.test/first.webp');
  assert.throws(() => buildMedia({ 'slot-00': slots['slot-00'] }, 2), {
    code: 'failed-precondition',
  });
});

test('storage trigger accepts only canonical source paths', () => {
  assert.ok(ORIGINAL_PATH_PATTERN.test(
    'furniture/publication-sessions/publication-session-0001/originals/slot-00/source.webp'
  ));
  assert.equal(ORIGINAL_PATH_PATTERN.test(
    'furniture/publication-sessions/publication-session-0001/variants/slot-00/full.webp'
  ), false);
  assert.equal(ORIGINAL_PATH_PATTERN.test(
    'furniture/publication-sessions/short/originals/slot-00/source.webp'
  ), false);
});
