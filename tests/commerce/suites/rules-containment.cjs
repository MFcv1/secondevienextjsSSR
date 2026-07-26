'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { assertFails, assertSucceeds, initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { deleteDoc, doc, getDoc, setDoc, updateDoc } = require('firebase/firestore');
const { deleteObject, ref, uploadString } = require('firebase/storage');

const PROJECT_ID = 'demo-secondevie-commerce';
const FIRESTORE_PORT = 8185;
const STORAGE_PORT = 9295;
const repositoryRoot = path.resolve(__dirname, '..', '..', '..');

function assertEmulatorBoundary() {
  if (!PROJECT_ID.startsWith('demo-')) throw new Error('Rules tests require a demo-* project');
  if (process.env.GCLOUD_PROJECT !== PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT !== PROJECT_ID) {
    throw new Error('Rules test project environment is not the fixed demo project');
  }
  if (process.env.FIRESTORE_EMULATOR_HOST !== `127.0.0.1:${FIRESTORE_PORT}`) {
    throw new Error('Rules tests require the fixed local Firestore emulator port');
  }
  if (process.env.FIREBASE_STORAGE_EMULATOR_HOST !== `127.0.0.1:${STORAGE_PORT}`) {
    throw new Error('Rules tests require the fixed local Storage emulator port');
  }
}

async function withEnvironment(run) {
  assertEmulatorBoundary();
  const environment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: '127.0.0.1',
      port: FIRESTORE_PORT,
      rules: fs.readFileSync(path.join(repositoryRoot, 'firestore.rules'), 'utf8'),
    },
    storage: {
      host: '127.0.0.1',
      port: STORAGE_PORT,
      rules: fs.readFileSync(path.join(repositoryRoot, 'storage.rules'), 'utf8'),
    },
  });
  try {
    await environment.clearFirestore();
    if (typeof environment.clearStorage === 'function') await environment.clearStorage();
    return await run(environment);
  } finally {
    await environment.cleanup();
  }
}

async function seed(environment, entries) {
  await environment.withSecurityRulesDisabled(async (context) => {
    for (const [documentPath, value] of entries) {
      await setDoc(doc(context.firestore(), documentPath), value);
    }
  });
}

async function seedAdmin(environment, uid = 'admin-1') {
  await seed(environment, [[`sys_admin_access/${uid}`, { active: true }]]);
}

function strongAdmin(environment, uid = 'admin-1') {
  return environment.authenticatedContext(uid, {
    admin: true,
    email: `${uid}@example.test`,
    email_verified: true,
    firebase: { sign_in_provider: 'google.com' },
  });
}

const scenarios = {
  'visitor-order-write-is-denied': async (context) => withEnvironment(async (environment) => {
    const visitor = environment.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(visitor, 'orders/visitor-write'), {
      userId: 'visitor',
      status: 'paid',
    }));
    context.ok(true, 'visitor write was denied by Firestore Rules');
  }),

  'owner-order-read-remains-allowed': async (context) => withEnvironment(async (environment) => {
    await seed(environment, [[
      'orders/owner-order',
      {
        userId: 'owner-1',
        userEmail: 'owner@example.test',
        checkoutAuthMethod: 'authenticated',
        status: 'pending_payment',
      },
    ]]);
    const owner = environment.authenticatedContext('owner-1', {
      email: 'owner@example.test',
      email_verified: true,
      firebase: { sign_in_provider: 'password' },
    }).firestore();
    const snapshot = await assertSucceeds(getDoc(doc(owner, 'orders/owner-order')));
    context.equal(snapshot.exists(), true, 'legitimate owner read must remain available');
  }),

  'admin-order-read-remains-allowed': async (context) => withEnvironment(async (environment) => {
    await seedAdmin(environment);
    await seed(environment, [['orders/admin-readable', { userId: 'customer-1', status: 'paid' }]]);
    const snapshot = await assertSucceeds(getDoc(doc(strongAdmin(environment).firestore(), 'orders/admin-readable')));
    context.equal(snapshot.exists(), true, 'strong admin read must remain available');
  }),

  'admin-order-write-is-denied': async (context) => withEnvironment(async (environment) => {
    await seedAdmin(environment);
    const admin = strongAdmin(environment).firestore();
    await assertFails(setDoc(doc(admin, 'orders/admin-write'), {
      userId: 'customer-1',
      status: 'paid',
    }));
    context.ok(true, 'even a strong admin cannot create orders through the client SDK');
  }),

  'admin-order-delete-is-denied': async (context) => withEnvironment(async (environment) => {
    await seedAdmin(environment);
    await seed(environment, [['orders/admin-delete', { userId: 'customer-1', status: 'paid' }]]);
    await assertFails(deleteDoc(doc(strongAdmin(environment).firestore(), 'orders/admin-delete')));
    context.ok(true, 'even a strong admin cannot delete orders through the client SDK');
  }),

  'admin-product-commerce-update-is-denied': async (context) => withEnvironment(async (environment) => {
    await seedAdmin(environment);
    const productPath = 'artifacts/secondevie/public/data/furniture/gate-0b-product';
    await seed(environment, [[productPath, {
      name: 'Meuble Gate 0B',
      description: 'Document de test local',
      images: [],
      currentPrice: 100,
      stock: 1,
      sold: false,
    }]]);
    await assertFails(updateDoc(doc(strongAdmin(environment).firestore(), productPath), {
      currentPrice: 1,
      stock: 99,
      sold: true,
    }));
    context.ok(true, 'commerce fields are immutable through the client SDK');
  }),

  'admin-product-editorial-update-remains-allowed': async (context) => withEnvironment(async (environment) => {
    await seedAdmin(environment);
    const productPath = 'artifacts/secondevie/public/data/furniture/gate-0b-editorial';
    await seed(environment, [[productPath, {
      name: 'Meuble Gate 0B',
      description: 'Avant',
      images: [],
      currentPrice: 100,
      stock: 1,
      sold: false,
    }]]);
    await assertSucceeds(updateDoc(doc(strongAdmin(environment).firestore(), productPath), {
      description: 'Apres',
    }));
    context.ok(true, 'non-commerce editorial corrections remain available');
  }),

  'admin-protected-commerce-settings-write-is-denied': async (context) => withEnvironment(async (environment) => {
    await seedAdmin(environment);
    const admin = strongAdmin(environment).firestore();
    for (const docId of ['stripe_connect', 'delivery', 'payment_settings']) {
      await assertFails(setDoc(doc(admin, `sys_metadata/${docId}`), { enabled: true }));
    }
    context.ok(true, 'commerce policy settings are backend-only during containment');
  }),

  'commerce-control-document-is-backend-only': async (context) => withEnvironment(async (environment) => {
    await seedAdmin(environment);
    await seed(environment, [['sys_commerce_control/current', { legacyMode: 'off' }]]);
    const admin = strongAdmin(environment).firestore();
    await assertFails(getDoc(doc(admin, 'sys_commerce_control/current')));
    await assertFails(setDoc(doc(admin, 'sys_commerce_control/current'), { legacyMode: 'enabled' }));
    context.ok(true, 'control document cannot be read or mutated through the client SDK');
  }),

  'storage-admin-delete-is-denied': async (context) => withEnvironment(async (environment) => {
    const storage = strongAdmin(environment).storage();
    const mediaRef = ref(storage, 'furniture/gate-0b-delete-proof.jpg');
    await assertSucceeds(uploadString(mediaRef, 'local-proof', 'raw', { contentType: 'image/jpeg' }));
    await assertFails(deleteObject(mediaRef));
    context.ok(true, 'strong admin upload remains possible but media deletion is denied');
  }),
};

module.exports = { scenarios };
