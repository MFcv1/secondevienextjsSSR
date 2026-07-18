const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { after, before, beforeEach, test } = require('node:test');
const { assertFails, assertSucceeds, initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc } = require('firebase/firestore');
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

test('visitor sees published products but not drafts', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'artifacts/secondevie/public/data/furniture/published'), {
      status: 'published', name: 'Published', description: '', images: [], stock: 1,
    });
    await setDoc(doc(context.firestore(), 'artifacts/secondevie/public/data/furniture/draft'), {
      status: 'draft', name: 'Draft', description: '', images: [], stock: 1,
    });
  });
  const visitor = environment.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(visitor, 'artifacts/secondevie/public/data/furniture/published')));
  await assertFails(getDoc(doc(visitor, 'artifacts/secondevie/public/data/furniture/draft')));
});

test('catalog publication state is backend-only for every client role', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'sys_admin_access/admin-1'), { active: true });
    await setDoc(doc(context.firestore(), 'sys_catalog_publication/secondevie'), { mode: 'shadow', desiredRevision: 1 });
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
