import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'secondevienextjsssr';
const APP_ID = process.env.E2E_APP_ID || process.env.PUBLIC_APP_ID || process.env.APP_ID || 'secondevie';
const PRODUCT_ID = process.env.E2E_STRIPE_PRODUCT_ID || 'sv-e2e-stripe-refund-product';
const STOCK = Number.parseInt(process.env.E2E_STRIPE_PRODUCT_STOCK || '1', 10);
const PRICE = Number.parseInt(process.env.E2E_STRIPE_PRODUCT_PRICE_CENTS || '14000', 10) / 100;
const COLLECTION_PATH = `artifacts/${APP_ID}/public/data/furniture`;
const META_PATH = `artifacts/${APP_ID}/public/meta`;

if (!Number.isFinite(STOCK) || STOCK < 1) {
  throw new Error('E2E_STRIPE_PRODUCT_STOCK must be a positive integer.');
}

if (!Number.isFinite(PRICE) || PRICE <= 0) {
  throw new Error('E2E_STRIPE_PRODUCT_PRICE_CENTS must be a positive integer amount in cents.');
}

if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
    projectId: PROJECT_ID,
  });
}

const db = getFirestore();
const productRef = db.collection(COLLECTION_PATH).doc(PRODUCT_ID);
const metaRef = db.doc(META_PATH);
const now = FieldValue.serverTimestamp();

const productData = {
  name: '[TEST STRIPE SANDBOX] Produit refund repetable',
  title: '[TEST STRIPE SANDBOX] Produit refund repetable',
  category: 'deco',
  material: 'Test sandbox',
  description: 'Produit dedie aux parcours E2E Stripe sandbox. Ne pas utiliser pour le vrai catalogue client.',
  currentPrice: PRICE,
  startingPrice: PRICE,
  price: PRICE,
  priceOnRequest: false,
  width: '10',
  depth: '10',
  height: '10',
  dimensions: '10 x 10 x 10 cm',
  images: ['/images/gallery-hero-1.webp'],
  imageUrl: '/images/gallery-hero-1.webp',
  thumbnails: ['/images/gallery-hero-1.webp'],
  thumbnailUrl: '/images/gallery-hero-1.webp',
  stock: STOCK,
  sold: false,
  buyerId: FieldValue.delete(),
  soldAt: FieldValue.delete(),
  refundedFromOrderId: FieldValue.delete(),
  refundedAt: FieldValue.delete(),
  status: 'published',
  e2eOnly: true,
  e2ePurpose: 'stripe-refund-repeatable',
  updatedAt: now,
};

await productRef.set({
  ...productData,
  createdAt: now,
}, { merge: true });

await metaRef.set({
  catalogVersion: `e2e-stripe-${Date.now()}`,
  updatedAt: now,
  updatedBy: 'seed-e2e-stripe-product',
}, { merge: true });

console.log(`E2E Stripe product ready: ${PRODUCT_ID}`);
console.log(`Project: ${PROJECT_ID}`);
console.log(`Path: ${COLLECTION_PATH}/${PRODUCT_ID}`);
console.log(`Stock: ${STOCK}`);
console.log(`Price: ${PRICE.toFixed(2)} EUR`);
