const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const crypto = require('crypto');

const db = admin.firestore();
const APP_ID = process.env.PUBLIC_APP_ID || process.env.APP_ID || 'secondevie';
const CACHE_TTL_MS = 5 * 60 * 1000;
const PUBLIC_COLLECTIONS = ['furniture'];
const DEFAULT_CATALOG_VERSION = 'unversioned';
const ALLOWED_ORIGINS = new Set([
    ...String(process.env.PUBLIC_ALLOWED_ORIGINS || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    'http://localhost:5173',
    'http://localhost:4173',
    'http://localhost:3000',
    'http://localhost:4300',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4300',
    'https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app',
    'https://secondevienextjsssr.web.app',
    'https://secondevienextjsssr.firebaseapp.com'
]);

let cachedCatalog = null;
let cachedAt = 0;
let inflightCatalogRead = null;
let inflightCatalogReadVersion = null;
const limitedCatalogCache = new Map();
const limitedInflightReads = new Map();
const CARD_SCOPE = 'cards';

const getCatalogVersionValue = (data = {}) => {
    const value = data.catalogVersion || data.updatedAt;
    if (value instanceof admin.firestore.Timestamp) {
        return `${value.seconds}.${value.nanoseconds || 0}`;
    }
    if (typeof value === 'string' && value) return value;
    if (Number.isFinite(value)) return String(value);
    return DEFAULT_CATALOG_VERSION;
};

const readCatalogVersion = async () => {
    const snap = await db
        .collection('artifacts')
        .doc(APP_ID)
        .collection('public')
        .doc('meta')
        .get();

    return snap.exists ? getCatalogVersionValue(snap.data()) : DEFAULT_CATALOG_VERSION;
};

const serializeValue = (value) => {
    if (!value) return value;
    if (value instanceof admin.firestore.Timestamp) {
        return {
            seconds: value.seconds,
            nanoseconds: value.nanoseconds
        };
    }
    if (Array.isArray(value)) return value.map(serializeValue);
    if (typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, nested]) => [key, serializeValue(nested)])
        );
    }
    return value;
};

const normalizeCategoryList = (categories = []) => (
    [...new Set(categories
        .map((category) => String(category || '').trim())
        .filter(Boolean))]
        .slice(0, 10)
);

const encodeCursor = (item) => {
    const createdAt = item?.createdAt;
    if (!Number.isFinite(createdAt?.seconds)) return null;

    return Buffer.from(JSON.stringify({
        createdAt: {
            seconds: createdAt.seconds,
            nanoseconds: createdAt.nanoseconds || 0
        }
    })).toString('base64url');
};

const decodeCursor = (rawCursor) => {
    if (!rawCursor) return null;

    try {
        const decoded = JSON.parse(Buffer.from(String(rawCursor), 'base64url').toString('utf8'));
        const seconds = Number(decoded?.createdAt?.seconds);
        const nanoseconds = Number(decoded?.createdAt?.nanoseconds || 0);
        if (!Number.isFinite(seconds) || !Number.isFinite(nanoseconds)) return null;
        return new admin.firestore.Timestamp(seconds, nanoseconds);
    } catch {
        return null;
    }
};

const readPublicCollection = async (collectionName, options = {}) => {
    const {
        limitCount = null,
        categories = [],
        cursor = null
    } = options;
    const categoryFilters = normalizeCategoryList(categories);
    let ref = db
        .collection('artifacts')
        .doc(APP_ID)
        .collection('public')
        .doc('data')
        .collection(collectionName)
        .where('status', '==', 'published');

    if (categoryFilters.length === 1) {
        ref = ref.where('category', '==', categoryFilters[0]);
    } else if (categoryFilters.length > 1) {
        ref = ref.where('category', 'in', categoryFilters);
    }

    if (limitCount || categoryFilters.length || cursor) {
        ref = ref.orderBy('createdAt', 'desc');
    }

    const cursorTimestamp = decodeCursor(cursor);
    if (cursorTimestamp) {
        ref = ref.startAfter(cursorTimestamp);
    }

    if (limitCount) {
        ref = ref.limit(limitCount + 1);
    }

    const snap = await ref.get();
    const docs = snap.docs.slice(0, limitCount || snap.docs.length);
    const hasMore = Boolean(limitCount && snap.docs.length > limitCount);

    const items = docs.map((doc) => ({
        id: doc.id,
        collectionName,
        ...serializeValue(doc.data())
    }));

    return {
        items,
        nextCursor: hasMore ? encodeCursor(items[items.length - 1]) : null
    };
};

const firstImageVariantForCard = (imageVariants) => {
    const firstVariant = Array.isArray(imageVariants) ? imageVariants[0] : null;
    if (!firstVariant || typeof firstVariant !== 'object') return [];

    const { thumb, card, medium } = firstVariant;
    const projected = {};
    if (thumb) projected.thumb = thumb;
    if (card) projected.card = card;
    if (medium) projected.medium = medium;
    return Object.keys(projected).length ? [projected] : [];
};

const firstImageMetadataForCard = (imageMetadata) => {
    const firstMetadata = Array.isArray(imageMetadata) ? imageMetadata[0] : null;
    if (!firstMetadata || typeof firstMetadata !== 'object') return [];

    const projected = {};
    ['width', 'height', 'ratio', 'dominantColor', 'blurDataUrl'].forEach((key) => {
        if (firstMetadata[key]) projected[key] = firstMetadata[key];
    });

    return Object.keys(projected).length ? [projected] : [];
};

const projectCardItem = (item) => {
    const firstThumbnail = Array.isArray(item.thumbnails) ? item.thumbnails[0] : null;
    const firstImage = Array.isArray(item.images) ? item.images[0] : null;
    const firstVariants = firstImageVariantForCard(item.imageVariants);
    const firstMetadata = firstImageMetadataForCard(item.imageMetadata);

    return {
        id: item.id,
        collectionName: item.collectionName,
        status: item.status,
        name: item.name,
        title: item.title,
        category: item.category,
        material: item.material,
        sold: item.sold,
        stock: item.stock,
        currentPrice: item.currentPrice,
        startingPrice: item.startingPrice,
        price: item.price,
        priceOnRequest: item.priceOnRequest,
        nouveautesOrder: item.nouveautesOrder,
        petitsPrixOrder: item.petitsPrixOrder,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        thumbnailUrl: item.thumbnailUrl || firstThumbnail || firstVariants[0]?.thumb || '',
        imageUrl: item.imageUrl || firstVariants[0]?.card || firstVariants[0]?.medium || firstImage || '',
        thumbnails: firstThumbnail ? [firstThumbnail] : [],
        imageVariants: firstVariants,
        imageMetadata: firstMetadata
    };
};

const projectCollectionItems = (items, scope) => (
    scope === CARD_SCOPE ? items.map(projectCardItem) : items
);

const readSegmentedPublicCatalog = async (limitCount, scope = 'full', options = {}) => {
    const now = Date.now();
    const categories = normalizeCategoryList(options.categories);
    const cursor = options.cursor || '';
    const catalogVersion = options.catalogVersion || DEFAULT_CATALOG_VERSION;
    const cacheKey = `${catalogVersion}:${scope}:${limitCount || 'all'}:${categories.join(',')}:${cursor}`;
    const cached = limitedCatalogCache.get(cacheKey);
    if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
        return cached.catalog;
    }

    if (!limitedInflightReads.has(cacheKey)) {
        limitedInflightReads.set(cacheKey, Promise.all(
            PUBLIC_COLLECTIONS.map(async (collectionName) => {
                const result = await readPublicCollection(collectionName, {
                    limitCount,
                    categories,
                    cursor
                });
                return [
                    collectionName,
                    {
                        items: projectCollectionItems(result.items, scope),
                        nextCursor: result.nextCursor
                    }
                ];
            })
        )
            .then((entries) => {
                const collections = Object.fromEntries(entries.map(([collectionName, result]) => [
                    collectionName,
                    result.items
                ]));
                const cursors = Object.fromEntries(entries.map(([collectionName, result]) => [
                    collectionName,
                    result.nextCursor
                ]));
                const catalog = {
                    appId: APP_ID,
                    catalogVersion,
                    generatedAt: new Date().toISOString(),
                    partial: Boolean(limitCount || categories.length || cursor),
                    limit: limitCount || null,
                    scope,
                    categories,
                    cursor: cursor || null,
                    nextCursor: PUBLIC_COLLECTIONS.length === 1 ? cursors[PUBLIC_COLLECTIONS[0]] : null,
                    cursors,
                    collections
                };
                limitedCatalogCache.set(cacheKey, {
                    cachedAt: Date.now(),
                    catalog
                });
                return catalog;
            })
            .finally(() => {
                limitedInflightReads.delete(cacheKey);
            }));
    }

    return limitedInflightReads.get(cacheKey);
};

const readPublicCatalog = async (limitCount = null, scope = 'full', options = {}) => {
    const categories = normalizeCategoryList(options.categories);
    const cursor = options.cursor || '';
    const catalogVersion = options.catalogVersion || DEFAULT_CATALOG_VERSION;
    if (limitCount || categories.length || cursor) {
        return readSegmentedPublicCatalog(limitCount, scope, { categories, cursor, catalogVersion });
    }

    const now = Date.now();
    if (cachedCatalog && cachedCatalog.catalogVersion === catalogVersion && now - cachedAt < CACHE_TTL_MS) {
        return cachedCatalog;
    }

    if (!inflightCatalogRead || inflightCatalogReadVersion !== catalogVersion) {
        inflightCatalogReadVersion = catalogVersion;
        const readPromise = Promise.all(
            PUBLIC_COLLECTIONS.map(async (collectionName) => {
                const result = await readPublicCollection(collectionName);
                return [collectionName, result.items];
            })
        )
            .then((entries) => {
                cachedCatalog = {
                    appId: APP_ID,
                    catalogVersion,
                    generatedAt: new Date().toISOString(),
                    collections: Object.fromEntries(entries)
                };
                cachedAt = Date.now();
                return cachedCatalog;
            })
            .finally(() => {
                if (inflightCatalogRead === readPromise) {
                    inflightCatalogRead = null;
                    inflightCatalogReadVersion = null;
                }
            });
        inflightCatalogRead = readPromise;
    }

    return inflightCatalogRead;
};

const parsePositiveLimit = (rawLimit) => {
    const value = Number.parseInt(rawLimit, 10);
    if (!Number.isFinite(value) || value <= 0) return null;
    return Math.min(value, 120);
};

const parseScope = (rawScope) => (
    rawScope === CARD_SCOPE ? CARD_SCOPE : 'full'
);

const parseCategories = (query) => normalizeCategoryList(
    []
        .concat(query.category || [])
        .concat(query.categories || [])
        .flatMap((value) => String(value || '').split(','))
);

const sendCatalogResponse = (req, res, catalog) => {
    const body = JSON.stringify(catalog);
    const etag = `"${crypto.createHash('sha1').update(body).digest('base64url')}"`;
    res.set('ETag', etag);

    if (req.get('if-none-match') === etag) {
        res.status(304).send('');
        return;
    }

    res.status(200).type('application/json').send(body);
};

exports.publicCatalog = functions.https.onRequest(async (req, res) => {
    const origin = req.get('origin');
    if (ALLOWED_ORIGINS.has(origin)) {
        res.set('Access-Control-Allow-Origin', origin);
        res.set('Vary', 'Origin');
    }
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const limit = parsePositiveLimit(req.query.limit);
        const scope = parseScope(req.query.scope);
        const categories = parseCategories(req.query);
        const cursor = req.query.cursor ? String(req.query.cursor) : '';
        const catalogVersion = await readCatalogVersion();
        sendCatalogResponse(req, res, await readPublicCatalog(limit, scope, { categories, cursor, catalogVersion }));
    } catch (error) {
        console.error('Public catalog failed:', error);
        res.status(500).json({ error: 'catalog_unavailable' });
    }
});
