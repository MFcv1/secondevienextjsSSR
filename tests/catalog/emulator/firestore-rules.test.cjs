const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { after, before, beforeEach, test } = require('node:test');
const { assertFails, assertSucceeds, initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc, updateDoc } = require('firebase/firestore');
const { PROJECT_ID, assertEmulatorEnvironment } = require('./emulator-guard.cjs');

let environment;

before(async () => {
  assertEmulatorEnvironment();
  environment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: fs.readFileSync(path.resolve(__dirname, '../../../firestore.rules'), 'utf8') },
  });
});

beforeEach(async () => environment.clearFirestore());
after(async () => environment?.cleanup());

test('visitors cannot read products or public/meta and admin access remains rule-scoped', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'artifacts/secondevie/public/data/furniture/published'), {
      status: 'published', name: 'Published', description: '', images: [], stock: 1,
    });
    await setDoc(doc(context.firestore(), 'artifacts/secondevie/public/data/furniture/draft'), {
      status: 'draft', name: 'Draft', description: '', images: [], stock: 1,
    });
    await setDoc(doc(context.firestore(), 'artifacts/secondevie/public/meta'), { catalogVersion: 1 });
    await setDoc(doc(context.firestore(), 'sys_admin_access/admin-1'), { active: true });
  });
  const visitor = environment.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(visitor, 'artifacts/secondevie/public/data/furniture/published')));
  await assertFails(getDoc(doc(visitor, 'artifacts/secondevie/public/data/furniture/draft')));
  await assertFails(getDoc(doc(visitor, 'artifacts/secondevie/public/meta')));
  const admin = environment.authenticatedContext('admin-1', {
    admin: true,
    firebase: { sign_in_provider: 'google.com' },
  }).firestore();
  await assertSucceeds(getDoc(doc(admin, 'artifacts/secondevie/public/data/furniture/published')));
  await assertFails(getDoc(doc(admin, 'artifacts/secondevie/public/meta')));
});

test('catalog publication state is backend-only for every client role', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'sys_admin_access/admin-1'), { active: true });
    await setDoc(doc(context.firestore(), 'sys_catalog_publication/secondevie'), { mode: 'active', desiredRevision: 1 });
  });
  const contexts = [
    environment.unauthenticatedContext(),
    environment.authenticatedContext('owner-1'),
    environment.authenticatedContext('admin-1', {
      admin: true,
      firebase: { sign_in_provider: 'google.com' },
    }),
  ];
  const collections = [
    'sys_catalog_publication/secondevie',
    'sys_catalog_publication_events/event',
    'sys_catalog_publication_builds/build',
    'sys_catalog_media_gc/media',
  ];
  for (const context of contexts) {
    for (const target of collections) {
      const ref = doc(context.firestore(), target);
      await assertFails(getDoc(ref));
      await assertFails(setDoc(ref, { attack: true }));
    }
  }
  assert.equal(contexts.length, 3);
});

test('active Google or passkey admins can edit back-office content without a time window', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'sys_admin_access/admin-google'), { active: true, role: 'admin' });
    await setDoc(doc(context.firestore(), 'sys_admin_access/admin-passkey'), { active: true, role: 'admin' });
    await setDoc(doc(context.firestore(), 'artifacts/secondevie/public/data/furniture/editable'), {
      status: 'published', name: 'Editable', description: '', images: [], stock: 1, startingPrice: 450,
    });
    await setDoc(doc(context.firestore(), 'sys_metadata/theme_settings'), { accent: 'stone' });
    await setDoc(doc(context.firestore(), 'sys_metadata/delivery'), { retrait: { active: true, price: 0 } });
  });

  const google = environment.authenticatedContext('admin-google', {
    admin: true,
    firebase: { sign_in_provider: 'google.com' },
  }).firestore();
  await assertSucceeds(updateDoc(
    doc(google, 'artifacts/secondevie/public/data/furniture/editable'),
    { name: 'Editable Google' }
  ));
  await assertFails(updateDoc(
    doc(google, 'artifacts/secondevie/public/data/furniture/editable'),
    { startingPrice: 1 }
  ));
  await assertFails(updateDoc(doc(google, 'sys_metadata/delivery'), { retrait: { active: false, price: 0 } }));

  const passkey = environment.authenticatedContext('admin-passkey', {
    admin: true,
    authMethod: 'passkey',
    authAssurance: 'aal2',
    userVerified: true,
    auth_time: Math.floor(Date.now() / 1000) - 86400,
  }).firestore();
  await assertSucceeds(updateDoc(doc(passkey, 'sys_metadata/theme_settings'), { accent: 'sauge' }));
});

test('catalog live expose uniquement le signal courant minimal et refuse toute ecriture client', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'sys_catalog_live/current'), {
      schemaVersion: 1,
      revision: 7,
      aggregateSha256: 'a'.repeat(64),
      changedProductIds: ['mirror-a'],
      affectedCategoryIds: ['miroirs', 'decorations'],
      affectsGallery: true,
      affectsSearch: true,
      full: false,
    });
    await setDoc(doc(context.firestore(), 'sys_catalog_live/history'), { revision: 6 });
  });
  const visitor = environment.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(visitor, 'sys_catalog_live/current')));
  await assertFails(getDoc(doc(visitor, 'sys_catalog_live/history')));
  await assertFails(setDoc(doc(visitor, 'sys_catalog_live/current'), {
    schemaVersion: 1,
    revision: 8,
    aggregateSha256: 'b'.repeat(64),
    changedProductIds: Array.from({ length: 1000 }, (_, index) => `product-${index}`),
  }));

  const admin = environment.authenticatedContext('admin-1', {
    admin: true,
    firebase: { sign_in_provider: 'google.com' },
  }).firestore();
  await assertSucceeds(getDoc(doc(admin, 'sys_catalog_live/current')));
  await assertFails(setDoc(doc(admin, 'sys_catalog_live/current'), { revision: 9 }));
});
