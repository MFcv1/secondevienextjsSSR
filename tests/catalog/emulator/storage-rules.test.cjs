const fs = require('node:fs');
const path = require('node:path');
const { after, before, beforeEach, test } = require('node:test');
const { assertFails, assertSucceeds, initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { getBytes, ref, uploadBytes } = require('firebase/storage');
const { PROJECT_ID, assertEmulatorEnvironment } = require('./emulator-guard.cjs');

let environment;

before(async () => {
  assertEmulatorEnvironment();
  environment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    storage: { rules: fs.readFileSync(path.resolve(__dirname, '../../../storage.rules'), 'utf8') },
  });
});

beforeEach(async () => environment.clearStorage());
after(async () => environment?.cleanup());

test('public media remains readable while visitor writes are denied', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await uploadBytes(ref(context.storage(), 'furniture/public.webp'), new Uint8Array([1, 2, 3]), { contentType: 'image/webp' });
  });
  const visitor = environment.unauthenticatedContext().storage();
  await assertSucceeds(getBytes(ref(visitor, 'furniture/public.webp')));
  await assertFails(uploadBytes(ref(visitor, 'furniture/attack.webp'), new Uint8Array([1]), { contentType: 'image/webp' }));
});

test('recent passkey admin media upload works but Google-only and stale sessions are denied', async () => {
  const admin = environment.authenticatedContext('admin-1', {
    admin: true,
    authMethod: 'passkey',
    authAssurance: 'aal2',
    userVerified: true,
    auth_time: Math.floor(Date.now() / 1000),
  }).storage();
  await assertSucceeds(uploadBytes(ref(admin, 'furniture/admin.webp'), new Uint8Array([1]), { contentType: 'image/webp' }));
  await assertFails(uploadBytes(ref(admin, 'catalog-projection/v1/pointers/current.json'), new Uint8Array([1]), { contentType: 'application/json' }));
  await assertFails(getBytes(ref(admin, 'catalog-projection/v1/pointers/current.json')));

  const googleOnlyAdmin = environment.authenticatedContext('admin-google', {
    admin: true,
    firebase: { sign_in_provider: 'google.com' },
    auth_time: Math.floor(Date.now() / 1000),
  }).storage();
  await assertFails(uploadBytes(ref(googleOnlyAdmin, 'furniture/google.webp'), new Uint8Array([1]), { contentType: 'image/webp' }));

  const stalePasskeyAdmin = environment.authenticatedContext('admin-stale', {
    admin: true,
    authMethod: 'passkey',
    authAssurance: 'aal2',
    userVerified: true,
    auth_time: Math.floor(Date.now() / 1000) - 901,
  }).storage();
  await assertFails(uploadBytes(ref(stalePasskeyAdmin, 'furniture/stale.webp'), new Uint8Array([1]), { contentType: 'image/webp' }));
});
