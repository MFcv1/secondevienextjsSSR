const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { signRevalidationBody } = require('../../functions/src/catalog/catalogRevalidation');

const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('Firestore public ne lit pas les meubles et public/meta a disparu', () => {
  const rules = read('firestore.rules');
  assert.match(rules, /match \/artifacts\/\{appId\}\/public\/data\/\{collectionName\}\/\{itemId\}[\s\S]*?allow read: if isStrongArtisan\(\);/);
  assert.doesNotMatch(rules, /public\/meta/);
});

test('signature HMAC est stable et lie timestamp et corps', () => {
  const first = signRevalidationBody('secret', '100', '{"revision":1}');
  assert.equal(first, signRevalidationBody('secret', '100', '{"revision":1}'));
  assert.notEqual(first, signRevalidationBody('secret', '101', '{"revision":1}'));
  assert.notEqual(first, signRevalidationBody('secret', '100', '{"revision":2}'));
});

test('aucun moteur catalogue legacy ne subsiste dans le code executable', () => {
  const executable = [
    read('app/api/catalog/route.js'),
    read('src/lib/server/products.js'),
    read('src/lib/server/env.js'),
    read('functions/index.js'),
    read('firebase.json'),
  ].join('\n');
  assert.doesNotMatch(executable, /publicCatalog|PUBLIC_CATALOG_SOURCE|snapshot_canary|x-catalog-canary|functions-public/);
  assert.match(read('functions/src/commerce/createOrder.js'), /reason: 'price_changed'/);
});
