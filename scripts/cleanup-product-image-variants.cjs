#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const ROOT_DIR = path.resolve(__dirname, '..');
const FIREBASERC_PATH = path.join(ROOT_DIR, '.firebaserc');
const DEFAULT_SERVICE_ACCOUNT_PATH = path.join(ROOT_DIR, 'service-account.json');
const PREVIEW_LIMIT = 40;

let sharedConfig = { APP_ID: 'secondevie', PRODUCT_COLLECTIONS: ['furniture'] };
try {
    sharedConfig = require('../functions/helpers/config');
} catch {
    // Keep the script usable if functions helpers are unavailable.
}

function parseArgs(argv) {
    const options = {
        dryRun: true,
        commit: false,
        env: 'sandbox',
        project: null,
        bucket: null,
        appId: null,
        collections: null,
        serviceAccount: null,
        limit: null,
        keepStorage: false,
        allowProduction: false,
        help: false,
    };

    for (const arg of argv) {
        if (arg === '--help' || arg === '-h') options.help = true;
        else if (arg === '--commit') {
            options.commit = true;
            options.dryRun = false;
        } else if (arg === '--dry-run') {
            options.commit = false;
            options.dryRun = true;
        } else if (arg === '--keep-storage') options.keepStorage = true;
        else if (arg === '--allow-production') options.allowProduction = true;
        else if (arg.startsWith('--env=')) options.env = arg.split('=')[1] || 'sandbox';
        else if (arg.startsWith('--project=')) options.project = arg.split('=')[1] || null;
        else if (arg.startsWith('--bucket=')) options.bucket = arg.split('=')[1] || null;
        else if (arg.startsWith('--app-id=')) options.appId = arg.split('=')[1] || null;
        else if (arg.startsWith('--collections=')) {
            options.collections = (arg.split('=')[1] || '')
                .split(',')
                .map((part) => part.trim())
                .filter(Boolean);
        } else if (arg.startsWith('--service-account=')) {
            options.serviceAccount = arg.split('=')[1] || null;
        } else if (arg.startsWith('--limit=')) {
            const value = Number(arg.split('=')[1]);
            if (Number.isFinite(value) && value >= 0) options.limit = Math.floor(value);
        }
    }

    return options;
}

function printHelp() {
    console.log(`
Clean legacy product image variants after reverting to the direct WebP pipeline.

Dry-run is the default and never updates Firestore or deletes Storage files.

Usage:
  node scripts/cleanup-product-image-variants.cjs --dry-run
  node scripts/cleanup-product-image-variants.cjs --commit

Options:
  --env=sandbox|production      Reads .env.sandbox or .env.production. Default: sandbox.
  --project=<alias-or-id>       Overrides Firebase project id.
  --bucket=<bucket-name>        Overrides VITE_FIREBASE_STORAGE_BUCKET.
  --app-id=<id>                 Overrides VITE_APP_LOGICAL_NAME.
  --collections=furniture       Comma-separated product collections.
  --service-account=<path>      Optional Firebase service account JSON.
  --limit=<n>                   Process at most n documents, but still protects all canonical image paths.
  --keep-storage                Only clean Firestore fields; do not delete legacy Storage files.
  --allow-production            Required with --commit --env=production.

Commit mode:
  - deletes imageVariants from product docs,
  - sets thumbnails to [] and thumbnailUrl to "",
  - deletes safe legacy Storage files under <collection>/responsive/ and <collection>/thumbnails/
    when they are not also used as canonical images/imageUrl.
`);
}

function readFirebaseAliases() {
    if (!fs.existsSync(FIREBASERC_PATH)) return {};
    try {
        return JSON.parse(fs.readFileSync(FIREBASERC_PATH, 'utf8')).projects || {};
    } catch {
        return {};
    }
}

function resolveProjectId(rawProject) {
    const aliases = readFirebaseAliases();
    if (!rawProject) return null;
    return aliases[rawProject] || rawProject;
}

function parseEnvFile(envName) {
    const envPath = path.join(ROOT_DIR, `.env.${envName}`);
    if (!fs.existsSync(envPath)) throw new Error(`Missing ${path.basename(envPath)}.`);

    const env = {};
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (!match) continue;
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        env[match[1]] = value;
    }
    return env;
}

function safeParseEnvFile(envName) {
    try {
        return parseEnvFile(envName);
    } catch {
        return {};
    }
}

function resolveRuntimeConfig(options) {
    if (!['sandbox', 'production'].includes(options.env)) {
        throw new Error(`Unsupported env "${options.env}". Use sandbox or production.`);
    }

    const env = parseEnvFile(options.env);
    const projectId = resolveProjectId(options.project)
        || env.VITE_FIREBASE_PROJECT_ID
        || process.env.GCLOUD_PROJECT
        || process.env.GOOGLE_CLOUD_PROJECT;
    if (!projectId) throw new Error('Unable to resolve Firebase project id.');

    if (options.project && !options.bucket && env.VITE_FIREBASE_PROJECT_ID && projectId !== env.VITE_FIREBASE_PROJECT_ID) {
        throw new Error(
            `Project override "${projectId}" does not match .env.${options.env} (${env.VITE_FIREBASE_PROJECT_ID}). ` +
            'Pass the matching --env or an explicit --bucket to avoid cross-environment writes.'
        );
    }

    const storageBucket = options.bucket || env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`;
    const appId = options.appId || env.VITE_APP_LOGICAL_NAME || sharedConfig.APP_ID || 'secondevie';
    const collections = options.collections?.length
        ? options.collections
        : (sharedConfig.PRODUCT_COLLECTIONS || ['furniture']);

    if (options.commit && options.env === 'production' && !options.allowProduction) {
        throw new Error('Refusing production cleanup without --allow-production.');
    }

    return { envName: options.env, projectId, storageBucket, appId, collections };
}

function resolveCredential(options) {
    const requestedPath = options.serviceAccount
        ? path.resolve(ROOT_DIR, options.serviceAccount)
        : DEFAULT_SERVICE_ACCOUNT_PATH;

    if (fs.existsSync(requestedPath)) {
        return {
            credential: admin.credential.cert(JSON.parse(fs.readFileSync(requestedPath, 'utf8'))),
            source: path.relative(ROOT_DIR, requestedPath),
        };
    }

    if (options.serviceAccount) throw new Error(`Service account not found: ${requestedPath}`);
    return { credential: admin.credential.applicationDefault(), source: 'Application Default Credentials' };
}

function initializeFirebase(runtime, options) {
    const credentialInfo = resolveCredential(options);
    admin.initializeApp({
        credential: credentialInfo.credential,
        projectId: runtime.projectId,
        storageBucket: runtime.storageBucket,
    });

    return {
        db: admin.firestore(),
        bucket: admin.storage().bucket(runtime.storageBucket),
        credentialSource: credentialInfo.source,
    };
}

function asArray(value) {
    return Array.isArray(value) ? value.filter(Boolean) : [];
}

function pushUrl(urls, value, source) {
    if (typeof value === 'string' && value.trim()) urls.push({ url: value.trim(), source });
}

function collectCanonicalUrls(data) {
    const urls = [];
    asArray(data.images).forEach((url, index) => pushUrl(urls, url, `images[${index}]`));
    pushUrl(urls, data.imageUrl, 'imageUrl');
    return urls;
}

function collectLegacyUrls(data) {
    const urls = [];
    asArray(data.thumbnails).forEach((url, index) => pushUrl(urls, url, `thumbnails[${index}]`));
    pushUrl(urls, data.thumbnailUrl, 'thumbnailUrl');

    if (Array.isArray(data.imageVariants)) {
        data.imageVariants.forEach((variant, index) => {
            if (!variant || typeof variant !== 'object') return;
            for (const [key, value] of Object.entries(variant)) {
                pushUrl(urls, value, `imageVariants[${index}].${key}`);
            }
        });
    }

    return urls;
}

function hasLegacyFields(data) {
    return Object.prototype.hasOwnProperty.call(data, 'imageVariants')
        || asArray(data.thumbnails).length > 0
        || Boolean(data.thumbnailUrl);
}

function parseStorageUrl(url) {
    if (typeof url !== 'string' || !url.trim()) return null;

    if (url.startsWith('gs://')) {
        const withoutScheme = url.slice('gs://'.length);
        const slashIndex = withoutScheme.indexOf('/');
        if (slashIndex < 0) return null;
        return {
            bucket: withoutScheme.slice(0, slashIndex),
            path: withoutScheme.slice(slashIndex + 1),
        };
    }

    try {
        const parsed = new URL(url);
        if (parsed.hostname !== 'firebasestorage.googleapis.com') return null;
        const match = parsed.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
        if (!match) return null;
        return {
            bucket: decodeURIComponent(match[1]),
            path: decodeURIComponent(match[2]),
        };
    } catch {
        return null;
    }
}

function isSafeLegacyPath(filePath, collectionName) {
    return filePath.startsWith(`${collectionName}/responsive/`)
        || filePath.startsWith(`${collectionName}/thumbnails/`);
}

async function collectProtectedStoragePaths(db, runtime) {
    const protectedPaths = new Set();

    for (const collectionName of runtime.collections) {
        const collectionRef = db.collection(`artifacts/${runtime.appId}/public/data/${collectionName}`);
        const snapshot = await collectionRef.get();
        snapshot.forEach((docSnap) => {
            collectCanonicalUrls(docSnap.data()).forEach(({ url }) => {
                const info = parseStorageUrl(url);
                if (info && info.bucket === runtime.storageBucket) protectedPaths.add(info.path);
            });
        });
    }

    return protectedPaths;
}

async function scanDocs(db, runtime, options, protectedPaths) {
    const docsToClean = [];
    const storageCandidates = new Map();
    const skippedStorage = [];
    const previews = [];
    const stats = {
        docsScanned: 0,
        docsWithLegacyFields: 0,
        docsToUpdate: 0,
        legacyUrlCount: 0,
        safeStorageDeleteCandidates: 0,
        skippedProtectedCanonical: 0,
        skippedUnsafePath: 0,
        skippedExternalOrOtherBucket: 0,
    };

    for (const collectionName of runtime.collections) {
        let query = db.collection(`artifacts/${runtime.appId}/public/data/${collectionName}`);
        if (options.limit !== null) query = query.limit(options.limit);

        const snapshot = await query.get();
        for (const docSnap of snapshot.docs) {
            stats.docsScanned++;
            const data = docSnap.data();
            if (!hasLegacyFields(data)) continue;

            stats.docsWithLegacyFields++;
            const legacyUrls = collectLegacyUrls(data);
            stats.legacyUrlCount += legacyUrls.length;

            const docSummary = {
                collectionName,
                id: docSnap.id,
                name: data.name || data.title || docSnap.id,
                legacyUrlCount: legacyUrls.length,
                storageDeleteCandidates: [],
            };

            legacyUrls.forEach(({ url, source }) => {
                const info = parseStorageUrl(url);
                if (!info || info.bucket !== runtime.storageBucket) {
                    stats.skippedExternalOrOtherBucket++;
                    skippedStorage.push({ collectionName, id: docSnap.id, source, reason: 'external-or-other-bucket', url });
                    return;
                }

                if (protectedPaths.has(info.path)) {
                    stats.skippedProtectedCanonical++;
                    skippedStorage.push({ collectionName, id: docSnap.id, source, reason: 'protected-canonical', path: info.path });
                    return;
                }

                if (!isSafeLegacyPath(info.path, collectionName)) {
                    stats.skippedUnsafePath++;
                    skippedStorage.push({ collectionName, id: docSnap.id, source, reason: 'unsafe-path', path: info.path });
                    return;
                }

                storageCandidates.set(info.path, { collectionName, id: docSnap.id, source, path: info.path });
                docSummary.storageDeleteCandidates.push(info.path);
            });

            docsToClean.push({
                ref: docSnap.ref,
                collectionName,
                id: docSnap.id,
                hasImageVariants: Object.prototype.hasOwnProperty.call(data, 'imageVariants'),
            });

            stats.docsToUpdate++;
            if (previews.length < PREVIEW_LIMIT) previews.push(docSummary);
        }
    }

    stats.safeStorageDeleteCandidates = storageCandidates.size;
    return { docsToClean, storageCandidates, skippedStorage, previews, stats };
}

async function updateFirestoreDocs(docsToClean) {
    const stats = { updatedDocs: 0 };
    let batch = null;
    let batchCount = 0;

    const flush = async () => {
        if (!batch || batchCount === 0) return;
        await batch.commit();
        batch = null;
        batchCount = 0;
    };

    for (const docInfo of docsToClean) {
        if (!batch) batch = docInfo.ref.firestore.batch();
        const update = {
            thumbnails: [],
            thumbnailUrl: '',
        };
        if (docInfo.hasImageVariants) update.imageVariants = admin.firestore.FieldValue.delete();
        batch.update(docInfo.ref, update);
        batchCount++;
        stats.updatedDocs++;
        if (batchCount >= 450) await flush();
    }

    await flush();
    return stats;
}

async function deleteStorageFiles(bucket, paths) {
    const stats = { deleted: 0, missing: 0, failed: [] };

    for (const filePath of paths) {
        try {
            await bucket.file(filePath).delete();
            stats.deleted++;
            console.log(`deleted ${filePath}`);
        } catch (error) {
            if (error.code === 404) {
                stats.missing++;
                continue;
            }
            stats.failed.push({ filePath, message: error.message });
        }
    }

    return stats;
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
        printHelp();
        return;
    }

    const runtime = resolveRuntimeConfig(options);
    const firebase = initializeFirebase(runtime, options);
    const protectedPaths = await collectProtectedStoragePaths(firebase.db, runtime);
    const scanResult = await scanDocs(firebase.db, runtime, options, protectedPaths);
    const storagePaths = Array.from(scanResult.storageCandidates.keys()).sort();

    const result = {
        mode: options.commit ? 'commit' : 'dry-run',
        projectId: runtime.projectId,
        storageBucket: runtime.storageBucket,
        appId: runtime.appId,
        collections: runtime.collections,
        credentialSource: firebase.credentialSource,
        keepStorage: options.keepStorage,
        protectedCanonicalPathCount: protectedPaths.size,
        ...scanResult.stats,
        previews: scanResult.previews,
        storageDeletePreview: storagePaths.slice(0, PREVIEW_LIMIT),
        storageDeletePreviewTruncated: storagePaths.length > PREVIEW_LIMIT,
        skippedStoragePreview: scanResult.skippedStorage.slice(0, PREVIEW_LIMIT),
        skippedStoragePreviewTruncated: scanResult.skippedStorage.length > PREVIEW_LIMIT,
    };

    if (!options.commit) {
        console.log(JSON.stringify(result, null, 2));
        return;
    }

    const firestoreStats = await updateFirestoreDocs(scanResult.docsToClean);
    const storageStats = options.keepStorage
        ? { deleted: 0, missing: 0, failed: [] }
        : await deleteStorageFiles(firebase.bucket, storagePaths);

    console.log(JSON.stringify({
        ...result,
        firestore: firestoreStats,
        storage: storageStats,
    }, null, 2));

    if (storageStats.failed.length > 0) process.exitCode = 1;
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
