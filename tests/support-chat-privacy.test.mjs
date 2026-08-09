import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { getSafeSupportPageUrl } from '../src/kit/marketplace/supportPageUrl.mjs';

test('support page context strips queries, fragments and payment-link secrets', () => {
  assert.equal(
    getSafeSupportPageUrl('https://example.test/produit/armoire?email=client@example.test#details'),
    'https://example.test/produit/armoire',
  );
  assert.equal(
    getSafeSupportPageUrl('https://example.test/payer/order-123/bearer-secret?retry=1'),
    'https://example.test',
  );
  assert.equal(getSafeSupportPageUrl('not a URL'), '');
});

test('support launcher is absent from every payment-link route', async () => {
  const launcher = await readFile(
    new URL('../src/kit/marketplace/SupportChatLauncherIsland.jsx', import.meta.url),
    'utf8',
  );
  assert.match(launcher, /HIDDEN_PATH_PREFIXES\s*=\s*\[[^\]]*['"]\/payer['"]/s);
});
