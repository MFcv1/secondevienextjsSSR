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
    authMethod: 'passkey',
    authAssurance: 'aal2',
    userVerified: true,
    auth_time: Math.floor(Date.now() / 1000),
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

  'same-email-different-uid-order-read-is-denied': async (context) => withEnvironment(async (environment) => {
    await seed(environment, [[
      'orders/email-collision-order',
      {
        userId: 'original-owner',
        userEmail: 'shared@example.test',
        checkoutAuthMethod: 'authenticated',
        status: 'paid',
      },
    ]]);
    const otherAccount = environment.authenticatedContext('different-uid', {
      email: 'shared@example.test',
      email_verified: true,
      firebase: { sign_in_provider: 'google.com' },
    }).firestore();
    await assertFails(getDoc(doc(otherAccount, 'orders/email-collision-order')));
    context.ok(true, 'verified email equality never replaces the checkout UID');
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

  'user-root-profile-is-backend-only': async (context) => withEnvironment(async (environment) => {
    const owner = environment.authenticatedContext('profile-owner').firestore();
    await assertFails(setDoc(doc(owner, 'users/profile-owner'), {
      displayName: 'Profil injecte',
    }));
    await seed(environment, [['users/profile-owner', { displayName: 'Profil serveur' }]]);
    await assertFails(updateDoc(doc(owner, 'users/profile-owner'), {
      displayName: 'Profil modifie',
    }));
    context.ok(true, 'root user profiles can only be materialized by trusted Functions');
  }),

  'owner-v2-cart-write-remains-allowed': async (context) => withEnvironment(async (environment) => {
    const owner = environment.authenticatedContext('cart-owner-v2').firestore();
    await assertSucceeds(setDoc(doc(owner, 'users/cart-owner-v2/cart/furniture_product-v2'), {
      originalId: 'product-v2',
      collectionName: 'furniture',
      name: 'Meuble panier v2',
      price: 120,
      stock: 1,
      sold: false,
      priceOnRequest: false,
      image: '',
      material: 'Bois',
      quantity: 1,
      cartLineId: 'cart-line-product-v2',
      cartRevision: 1,
      addedAt: new Date('2026-07-29T00:00:00.000Z'),
      updatedAt: new Date('2026-07-29T00:00:00.000Z'),
    }));
    context.ok(true, 'the authenticated checkout cart contract is accepted by Firestore Rules');
  }),

  'owner-invalid-v2-cart-revision-is-denied': async (context) => withEnvironment(async (environment) => {
    const owner = environment.authenticatedContext('cart-owner-invalid').firestore();
    await assertFails(setDoc(doc(owner, 'users/cart-owner-invalid/cart/furniture_invalid'), {
      originalId: 'invalid',
      collectionName: 'furniture',
      price: 10,
      quantity: 1,
      cartLineId: 'cart-line-invalid',
      cartRevision: -1,
      addedAt: new Date('2026-07-29T00:00:00.000Z'),
      updatedAt: new Date('2026-07-29T00:00:00.000Z'),
    }));
    context.ok(true, 'invalid v2 cart revisions remain rejected');
  }),

  'owner-valid-wishlist-write-remains-allowed': async (context) => withEnvironment(async (environment) => {
    const owner = environment.authenticatedContext('wishlist-owner').firestore();
    const wishlistRef = doc(owner, 'users/wishlist-owner/wishlist/product-1');
    await assertSucceeds(setDoc(wishlistRef, {
      originalId: 'product-1',
      id: 'product-1',
      collectionName: 'furniture',
      name: 'Meuble souhaite',
      price: 120,
      image: 'https://example.test/product-1.webp',
      material: 'Bois',
      addedAt: new Date('2026-08-12T00:00:00.000Z'),
    }));
    await assertSucceeds(deleteDoc(wishlistRef));
    context.ok(true, 'the bounded wishlist payload and owner deletion remain available');
  }),

  'owner-malformed-wishlist-write-is-denied': async (context) => withEnvironment(async (environment) => {
    const owner = environment.authenticatedContext('wishlist-invalid').firestore();
    await assertFails(setDoc(doc(owner, 'users/wishlist-invalid/wishlist/product-1'), {
      originalId: 'another-product',
      addedAt: new Date('2026-08-12T00:00:00.000Z'),
    }));
    await assertFails(setDoc(doc(owner, 'users/wishlist-invalid/wishlist/product-1'), {
      originalId: 'product-1',
      addedAt: new Date('2026-08-12T00:00:00.000Z'),
      injectedRole: 'admin',
    }));
    context.ok(true, 'mismatched IDs and unexpected wishlist fields are denied');
  }),

  'security-audits-are-backend-only': async (context) => withEnvironment(async (environment) => {
    await seedAdmin(environment);
    await seed(environment, [
      ['sys_audit_security/event-1', { eventType: 'test' }],
      ['sys_audit_stripe_connect/event-1', { eventType: 'test' }],
    ]);
    const admin = strongAdmin(environment).firestore();
    for (const auditPath of ['sys_audit_security/event-1', 'sys_audit_stripe_connect/event-1']) {
      await assertFails(getDoc(doc(admin, auditPath)));
      await assertFails(setDoc(doc(admin, auditPath), { eventType: 'tampered' }));
    }
    context.ok(true, 'security audit collections remain inaccessible to every client SDK');
  }),

  'storage-admin-delete-is-denied': async (context) => withEnvironment(async (environment) => {
    await seedAdmin(environment);
    const storage = strongAdmin(environment).storage();
    const mediaRef = ref(storage, 'furniture/gate-0b-delete-proof.jpg');
    await assertSucceeds(uploadString(mediaRef, 'local-proof', 'raw', { contentType: 'image/jpeg' }));
    await assertFails(deleteObject(mediaRef));
    context.ok(true, 'strong admin upload remains possible but media deletion is denied');
  }),
};

module.exports = { scenarios };
