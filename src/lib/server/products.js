import 'server-only';

import { cache } from 'react';
import { getAdminDb } from './firebaseAdmin';
import { publicCatalogUrl, publicEnv } from './env';

export const PUBLIC_DATA_REVALIDATE_SECONDS = 300;

const PUBLIC_PRODUCT_FIELDS = [
  'id',
  'collectionName',
  'status',
  'name',
  'title',
  'description',
  'category',
  'material',
  'style',
  'origin',
  'dimensions',
  'width',
  'depth',
  'height',
  'weight',
  'sold',
  'stock',
  'currentPrice',
  'startingPrice',
  'price',
  'priceOnRequest',
  'imageUrl',
  'thumbnailUrl',
  'images',
  'thumbnails',
  'imageVariants',
  'imageMetadata',
  'createdAt',
  'updatedAt'
];

export const extractProductId = (slugOrId = '') => {
  const decoded = decodeURIComponent(String(slugOrId));
  const separatorIndex = decoded.lastIndexOf('-');
  return separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : decoded;
};

const serializeValue = (value) => {
  if (!value) return value;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, serializeValue(nested)])
    );
  }
  return value;
};

const projectPublicProduct = (id, data = {}) => {
  const product = {};
  PUBLIC_PRODUCT_FIELDS.forEach((field) => {
    if (field === 'id') product.id = id || data.id;
    else if (data[field] !== undefined) product[field] = serializeValue(data[field]);
  });
  product.collectionName = product.collectionName || 'furniture';
  return product;
};

const getProductViaAdmin = async (id) => {
  const db = getAdminDb();
  if (!db || !id) return null;

  const snap = await db
    .collection('artifacts')
    .doc(publicEnv.appId)
    .collection('public')
    .doc('data')
    .collection('furniture')
    .doc(id)
    .get();

  if (!snap.exists) return null;
  const data = snap.data();
  if (data?.status !== 'published') return null;
  return projectPublicProduct(snap.id, data);
};

const queryProductsViaAdmin = async ({ categoryIds = [], limitCount = 120 } = {}) => {
  const db = getAdminDb();
  if (!db) return [];

  let ref = db
    .collection('artifacts')
    .doc(publicEnv.appId)
    .collection('public')
    .doc('data')
    .collection('furniture')
    .where('status', '==', 'published');

  if (categoryIds.length === 1) {
    ref = ref.where('category', '==', categoryIds[0]);
  } else if (categoryIds.length > 1) {
    ref = ref.where('category', 'in', categoryIds.slice(0, 10));
  }

  const snap = await ref.limit(Math.max(1, Math.min(limitCount, 500))).get();
  return snap.docs.map((docSnap) => projectPublicProduct(docSnap.id, docSnap.data()));
};

const getProductViaPublicCatalog = async (id) => {
  const url = publicCatalogUrl('');
  if (!url || !id) return null;

  const response = await fetch(url, {
    next: {
      revalidate: PUBLIC_DATA_REVALIDATE_SECONDS,
      tags: ['catalog', 'products', `product:${id}`]
    },
    headers: { accept: 'application/json' }
  });
  if (!response.ok) return null;

  const payload = await response.json();
  const product = (payload?.collections?.furniture || []).find((item) => item.id === id);
  if (!product || product.status !== 'published') return null;
  return projectPublicProduct(product.id, product);
};

const fromFirestoreRestValue = (value) => {
  if (!value || typeof value !== 'object') return undefined;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('booleanValue' in value) return Boolean(value.booleanValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(fromFirestoreRestValue);
  if ('mapValue' in value) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields || {}).map(([key, nested]) => [key, fromFirestoreRestValue(nested)])
    );
  }
  return undefined;
};

const fromFirestoreRestDocument = (document) => {
  if (!document?.fields) return null;
  const id = String(document.name || '').split('/').pop();
  return projectPublicProduct(
    id,
    Object.fromEntries(
      Object.entries(document.fields).map(([key, value]) => [key, fromFirestoreRestValue(value)])
    )
  );
};

const firestoreRestBaseUrl = () => {
  if (!publicEnv.projectId || !publicEnv.apiKey) return '';
  return `https://firestore.googleapis.com/v1/projects/${publicEnv.projectId}/databases/(default)/documents`;
};

const getProductViaFirestoreRest = async (id) => {
  const baseUrl = firestoreRestBaseUrl();
  if (!baseUrl || !id) return null;

  const url = `${baseUrl}/artifacts/${publicEnv.appId}/public/data/furniture/${encodeURIComponent(id)}?key=${encodeURIComponent(publicEnv.apiKey)}`;
  const response = await fetch(url, {
    next: {
      revalidate: PUBLIC_DATA_REVALIDATE_SECONDS,
      tags: ['products', `product:${id}`]
    }
  });
  if (!response.ok) return null;
  const product = fromFirestoreRestDocument(await response.json());
  if (!product || product.status !== 'published') return null;
  return product;
};

const queryProductsViaFirestoreRest = async ({ categoryIds = [], limitCount = 24 } = {}) => {
  const baseUrl = firestoreRestBaseUrl();
  if (!baseUrl) return [];

  const filters = [
    {
      fieldFilter: {
        field: { fieldPath: 'status' },
        op: 'EQUAL',
        value: { stringValue: 'published' }
      }
    }
  ];

  if (categoryIds.length === 1) {
    filters.push({
      fieldFilter: {
        field: { fieldPath: 'category' },
        op: 'EQUAL',
        value: { stringValue: categoryIds[0] }
      }
    });
  } else if (categoryIds.length > 1) {
    filters.push({
      fieldFilter: {
        field: { fieldPath: 'category' },
        op: 'IN',
        value: {
          arrayValue: {
            values: categoryIds.slice(0, 10).map((categoryId) => ({ stringValue: categoryId }))
          }
        }
      }
    });
  }

  const response = await fetch(`${baseUrl}:runQuery?key=${encodeURIComponent(publicEnv.apiKey)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    next: {
      revalidate: PUBLIC_DATA_REVALIDATE_SECONDS,
      tags: ['catalog', 'products', 'categories', ...categoryIds.map((categoryId) => `category:${categoryId}`)]
    },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'furniture' }],
        where: filters.length === 1 ? filters[0] : { compositeFilter: { op: 'AND', filters } },
        orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
        limit: Math.max(1, Math.min(limitCount, 120))
      },
      parent: `projects/${publicEnv.projectId}/databases/(default)/documents/artifacts/${publicEnv.appId}/public/data`
    })
  });

  if (!response.ok) return [];
  const rows = await response.json();
  return rows
    .map((row) => fromFirestoreRestDocument(row.document))
    .filter((product) => product?.status === 'published');
};

export const getPublicProduct = cache(async (slugOrId) => {
  const id = extractProductId(slugOrId);
  try {
    const product = await getProductViaAdmin(id);
    if (product) return product;
  } catch (error) {
    console.warn('[SSR] Admin product read unavailable, falling back to publicCatalog:', error?.message || error);
  }

  try {
    const product = await getProductViaPublicCatalog(id);
    if (product) return product;
  } catch (error) {
    console.warn('[SSR] publicCatalog product fallback unavailable:', error?.message || error);
  }

  try {
    return await getProductViaFirestoreRest(id);
  } catch (error) {
    console.warn('[SSR] Firestore REST product fallback unavailable:', error?.message || error);
    return null;
  }
});

export const getPublicCatalog = cache(async (params = '') => {
  const url = publicCatalogUrl(params);
  if (!url) return [];

  const response = await fetch(url, {
    next: {
      revalidate: PUBLIC_DATA_REVALIDATE_SECONDS,
      tags: ['catalog', 'products']
    },
    headers: { accept: 'application/json' }
  });
  if (!response.ok) return [];
  const payload = await response.json();
  return (payload?.collections?.furniture || []).filter((item) => item.status === 'published');
});

export const getPublicCatalogFallback = cache(async ({ categoryIds = [], limitCount = 24 } = {}) => {
  try {
    const products = await queryProductsViaAdmin({ categoryIds, limitCount });
    if (products.length) return products;
  } catch (error) {
    console.warn('[SSR] Admin catalog fallback unavailable:', error?.message || error);
  }

  try {
    return await queryProductsViaFirestoreRest({ categoryIds, limitCount });
  } catch (error) {
    console.warn('[SSR] Firestore REST catalog fallback unavailable:', error?.message || error);
    return [];
  }
});

export const getPublishedProductStaticParams = cache(async (limitCount = 120) => {
  const limit = Math.max(1, Math.min(limitCount, 500));
  let products = await getPublicCatalog(`scope=cards&limit=${limit}`);
  if (!products.length) {
    products = await getPublicCatalogFallback({ limitCount: limit });
  }
  return products
    .filter((product) => product?.id && product?.status === 'published')
    .map((product) => ({
      slugOrId: `${String(product.title || product.name || 'produit')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-') || 'produit'}-${encodeURIComponent(product.id)}`
    }));
});
