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
  assert.doesNotMatch(
    read('scripts/e2e-hosted-stripe-checkout.mjs'),
    /firestore\.googleapis\.com\/v1\/projects\/[^/]+\/databases\/\(default\)\/documents\/artifacts\/[^/]+\/public\/data\/furniture/,
  );
  const createOrder = read('functions/src/commerce/createOrder.js');
  assert.match(createOrder, /reason: 'price_changed'/);
  assert.equal((createOrder.match(/itemDb\.status !== 'published'/g) || []).length, 2);
  assert.equal((createOrder.match(/itemDb\.currentPrice \?\? itemDb\.startingPrice \?\? itemDb\.price/g) || []).length, 2);
  assert.doesNotMatch(createOrder, /itemDb\.currentPrice \|\| itemDb\.startingPrice/);

  const revalidationRoute = read('app/api/revalidate-catalog/route.js');
  assert.match(revalidationRoute, /addRevalidationPath\(pathEntries, '\/api\/catalog'\)/);
  assert.match(revalidationRoute, /addRevalidationPath\(pathEntries, '\/api\/search'\)/);
  assert.doesNotMatch(revalidationRoute, /revalidatePath\([^\n]+,\s*'route'\)/);
});

test('la fixture de build catalogue reste strictement bornee a la CI', () => {
  assert.match(read('.github/workflows/quality.yml'), /CATALOG_BUILD_FIXTURE:\s*["']true["']/);
  assert.doesNotMatch(read('apphosting.yaml'), /CATALOG_BUILD_FIXTURE/);
  assert.match(read('src/lib/server/materializedCatalog.js'), /process\.env\.CATALOG_BUILD_FIXTURE !== 'true'/);
});
