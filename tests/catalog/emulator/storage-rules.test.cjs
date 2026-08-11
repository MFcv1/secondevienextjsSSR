const fs = require('node:fs');
const path = require('node:path');
const { after, before, beforeEach, test } = require('node:test');
const { assertFails, assertSucceeds, initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc } = require('firebase/firestore');
const { getBytes, ref, uploadBytes } = require('firebase/storage');
const { PROJECT_ID, assertEmulatorEnvironment } = require('./emulator-guard.cjs');

let environment;

before(async () => {
  assertEmulatorEnvironment();
  environment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: fs.readFileSync(path.resolve(__dirname, '../../../firestore.rules'), 'utf8') },
    storage: { rules: fs.readFileSync(path.resolve(__dirname, '../../../storage.rules'), 'utf8') },
  });
});

beforeEach(async () => {
  await Promise.all([
    environment.clearFirestore(),
    environment.clearStorage(),
  ]);
  await environment.withSecurityRulesDisabled(async (context) => {
    for (const uid of ['admin-1', 'admin-google', 'admin-stale']) {
      await setDoc(doc(context.firestore(), 'sys_admin_access', uid), {
        active: true,
        role: 'admin',
      });
    }
  });
});
after(async () => environment?.cleanup());

test('public media remains readable while visitor writes are denied', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await uploadBytes(ref(context.storage(), 'furniture/public.webp'), new Uint8Array([1, 2, 3]), { contentType: 'image/webp' });
    await uploadBytes(ref(context.storage(), 'gallery/public.webp'), new Uint8Array([1, 2, 3]), { contentType: 'image/webp' });
    await uploadBytes(ref(context.storage(), 'future-private/data.webp'), new Uint8Array([1, 2, 3]), { contentType: 'image/webp' });
  });
  const visitor = environment.unauthenticatedContext().storage();
  await assertSucceeds(getBytes(ref(visitor, 'furniture/public.webp')));
  await assertSucceeds(getBytes(ref(visitor, 'gallery/public.webp')));
  await assertFails(getBytes(ref(visitor, 'future-private/data.webp')));
  await assertFails(uploadBytes(ref(visitor, 'furniture/attack.webp'), new Uint8Array([1]), { contentType: 'image/webp' }));
});

test('quote photos stay private even for a strong administrator SDK session', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await uploadBytes(
      ref(context.storage(), 'quote-requests/v1/quote_private/photo.webp'),
      new Uint8Array([1, 2, 3]),
      { contentType: 'image/webp' }
    );
  });
  const visitor = environment.unauthenticatedContext().storage();
  const admin = environment.authenticatedContext('admin-google', {
    admin: true,
    firebase: { sign_in_provider: 'google.com' },
  }).storage();
  const target = 'quote-requests/v1/quote_private/photo.webp';
  await assertFails(getBytes(ref(visitor, target)));
  await assertFails(uploadBytes(ref(visitor, target), new Uint8Array([4]), { contentType: 'image/webp' }));
  await assertFails(getBytes(ref(admin, target)));
  await assertFails(uploadBytes(ref(admin, target), new Uint8Array([4]), { contentType: 'image/webp' }));
});

test('active strong admins can upload back-office media without a fifteen-minute window', async () => {
  const googleOnlyAdmin = environment.authenticatedContext('admin-google', {
    admin: true,
    firebase: { sign_in_provider: 'google.com' },
    auth_time: Math.floor(Date.now() / 1000),
  }).storage();
  await assertSucceeds(uploadBytes(ref(googleOnlyAdmin, 'furniture/google.webp'), new Uint8Array([1]), { contentType: 'image/webp' }));

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

  const stalePasskeyAdmin = environment.authenticatedContext('admin-stale', {
    admin: true,
    authMethod: 'passkey',
    authAssurance: 'aal2',
    userVerified: true,
    auth_time: Math.floor(Date.now() / 1000) - 901,
  }).storage();
  await assertSucceeds(uploadBytes(ref(stalePasskeyAdmin, 'furniture/stale.webp'), new Uint8Array([1]), { contentType: 'image/webp' }));

  await assertSucceeds(uploadBytes(ref(googleOnlyAdmin, 'homepage/google.webp'), new Uint8Array([1]), { contentType: 'image/webp' }));
  await assertSucceeds(uploadBytes(ref(stalePasskeyAdmin, 'homepage/stale.webp'), new Uint8Array([1]), { contentType: 'image/webp' }));
  await assertFails(uploadBytes(ref(googleOnlyAdmin, 'future-private/google.webp'), new Uint8Array([1]), { contentType: 'image/webp' }));
});

test('furniture uploads require active registry, admin claim, strong assurance and a valid image', async () => {
  const noRegistry = environment.authenticatedContext('admin-no-registry', {
    admin: true,
    firebase: { sign_in_provider: 'google.com' },
  }).storage();
  await assertFails(uploadBytes(ref(noRegistry, 'furniture/no-registry.webp'), new Uint8Array([1]), { contentType: 'image/webp' }));

  const noAdminClaim = environment.authenticatedContext('admin-google', {
    firebase: { sign_in_provider: 'google.com' },
  }).storage();
  await assertFails(uploadBytes(ref(noAdminClaim, 'furniture/no-claim.webp'), new Uint8Array([1]), { contentType: 'image/webp' }));

  const weakAdmin = environment.authenticatedContext('admin-google', {
    admin: true,
    authMethod: 'email_otp',
    authAssurance: 'aal1',
    userVerified: false,
  }).storage();
  await assertFails(uploadBytes(ref(weakAdmin, 'furniture/weak.webp'), new Uint8Array([1]), { contentType: 'image/webp' }));

  const activeGoogleAdmin = environment.authenticatedContext('admin-google', {
    admin: true,
    firebase: { sign_in_provider: 'google.com' },
  }).storage();
  await assertFails(uploadBytes(ref(activeGoogleAdmin, 'furniture/not-an-image.txt'), new Uint8Array([1]), { contentType: 'text/plain' }));
});

test('durable publication accepts only owner source images and reserves variants for the backend', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'product_publication_sessions', 'publication-session-0001'), {
      ownerUid: 'admin-google',
      status: 'uploading',
      expectedMediaCount: 1,
      allowedSlots: ['slot-00'],
    });
  });
  const owner = environment.authenticatedContext('admin-google', {
    admin: true,
    firebase: { sign_in_provider: 'google.com' },
  }).storage();
  const otherAdmin = environment.authenticatedContext('admin-1', {
    admin: true,
    authMethod: 'passkey',
    authAssurance: 'aal2',
    userVerified: true,
  }).storage();
  const sourcePath = 'furniture/publication-sessions/publication-session-0001/originals/slot-00/source.webp';
  const variantPath = 'furniture/publication-sessions/publication-session-0001/variants/slot-00/responsive/full.webp';

  await assertSucceeds(uploadBytes(ref(owner, sourcePath), new Uint8Array([1]), { contentType: 'image/webp' }));
  await assertFails(getBytes(ref(owner, sourcePath)));
  await assertFails(uploadBytes(ref(otherAdmin, sourcePath), new Uint8Array([2]), { contentType: 'image/webp' }));
  await assertFails(uploadBytes(ref(owner, variantPath), new Uint8Array([1]), { contentType: 'image/webp' }));
  await assertFails(uploadBytes(
    ref(owner, 'furniture/publication-sessions/publication-session-0001/originals/slot-01/extra.webp'),
    new Uint8Array([1]),
    { contentType: 'image/webp' }
  ));
  await assertFails(uploadBytes(
    ref(owner, 'furniture/publication-sessions/publication-session-0001/unexpected.webp'),
    new Uint8Array([1]),
    { contentType: 'image/webp' }
  ));
});
