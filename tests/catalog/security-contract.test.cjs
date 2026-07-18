const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('catalog system collections are denied to every Firestore client', () => {
  const rules = read('firestore.rules');
  ['sys_catalog_publication', 'sys_catalog_publication_events', 'sys_catalog_publication_builds', 'sys_catalog_media_gc']
    .forEach((collection) => {
      assert.match(rules, new RegExp(`match /${collection}/\\{docId\\}[\\s\\S]*?allow read, write: if false;`));
    });
});

test('public projection code does not allow sensitive commerce fields', () => {
  const projection = read('functions/src/catalog/publicProjection.js');
  const allowlistBlock = projection.match(/PUBLIC_PRODUCT_FIELDS = Object\.freeze\(\[([\s\S]*?)\]\)/)?.[1] || '';
  ['buyerId', 'stripePaymentIntentId', 'adminNotes', 'refundedFromOrderId'].forEach((field) => {
    assert.doesNotMatch(allowlistBlock, new RegExp(field));
  });
});

test('snapshot mode has no automatic Firestore fallback', () => {
  const products = read('src/lib/server/products.js');
  const env = read('src/lib/server/env.js');
  assert.match(env, /CATALOG_EMERGENCY_FIRESTORE_FALLBACK/);
  assert.match(products, /if \(!publicEnv\.catalogEmergencyFirestoreFallback\) return \[\];/);
  assert.match(products, /if \(!publicEnv\.catalogEmergencyFirestoreFallback\) return null;/);
});

test('the lightweight source trigger never scans furniture', () => {
  const trigger = read('functions/src/catalog/onCatalogSourceWrite.js');
  assert.doesNotMatch(trigger, /collection\([^\n]*furniture|\.get\(\)/);
});
