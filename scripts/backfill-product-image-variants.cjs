#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const admin = require('firebase-admin');

const ROOT_DIR = path.resolve(__dirname, '..');
const FIREBASERC_PATH = path.join(ROOT_DIR, '.firebaserc');
const DEFAULT_SERVICE_ACCOUNT_PATH = path.join(ROOT_DIR, 'service-account.json');
const CACHE_CONTROL = 'public, max-age=31536000, immutable';
const PREVIEW_LIMIT = 25;
const VARIANT_SPECS = [
    { key: 'thumb', width: 480, quality: 74, folder: 'thumbnails' },
    { key: 'card', width: 768, quality: 78, folder: 'responsive' },
    { key: 'medium', width: 1024, quality: 80, folder: 'responsive' },
    { key: 'large', width: 1440, quality: 82, folder: 'responsive' },
    { key: 'full', width: 1920, quality: 85, folder: 'responsive' },
];

let sharedConfig = { APP_ID: 'secondevie', PRODUCT_COLLECTIONS: ['furniture'] };
try {
    sharedConfig = require('../functions/helpers/config');
} catch {
    // Keep the script usable if functions helpers are unavailable.
}

function parseArgs(argv) {
    const options = {
        commit: false,
        dryRun: true,
        env: null,
        project: null,
        bucket: null,
        appId: null,
        collections: null,
        serviceAccount: null,
        limit: null,
        force: false,
        publishedOnly: false,
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
        } else if (arg === '--force') options.force = true;
        else if (arg === '--published-only') options.publishedOnly = true;
        else if (arg === '--allow-production') options.allowProduction = true;
        else if (arg.startsWith('--env=')) options.env = arg.split('=')[1] || null;
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
Backfill responsive WebP product image variants.

Dry-run is the default and does not download, upload, update, or delete anything.
Commit mode creates missing imageVariants entries only; it keeps legacy images,
thumbnails, imageUrl and thumbnailUrl so old Storage files stay referenced.

Usage:
  node scripts/backfill-product-image-variants.cjs --dry-run
  node scripts/backfill-product-image-variants.cjs --commit

Options:
  --env=sandbox|production      Reads .env.sandbox or .env.production. Default: sandbox.
  --project=<alias-or-id>       Overrides Firebase project id. Alias comes from .firebaserc.
  --bucket=<bucket-name>        Overrides VITE_FIREBASE_STORAGE_BUCKET.
  --app-id=<id>                 Overrides VITE_APP_LOGICAL_NAME.
  --collections=furniture       Comma-separated product collections.
  --service-account=<path>      Optional Firebase service account JSON.
  --limit=<n>                   Process at most n documents per collection.
  --published-only              Process only docs where status == published.
  --force                       Regenerate every variant slot, even if already present.
  --allow-production            Required with --commit --env=production.

Generated variants:
  thumb 480, card 768, medium 1024, large 1440, full 1920.
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
    const requestedProjectId = resolveProjectId(options.project);
    let envName = options.env;
    if (!envName) {
        const productionEnv = safeParseEnvFile('production');
        envName = requestedProjectId && productionEnv.VITE_FIREBASE_PROJECT_ID === requestedProjectId
            ? 'production'
            : 'sandbox';
    }
    if (!['sandbox', 'production'].includes(envName)) {
        throw new Error(`Unsupported env "${envName}". Use sandbox or production.`);
    }

    const env = parseEnvFile(envName);
    const projectId = requestedProjectId
        || env.VITE_FIREBASE_PROJECT_ID
        || process.env.GCLOUD_PROJECT
        || process.env.GOOGLE_CLOUD_PROJECT;
    if (!projectId) throw new Error('Unable to resolve Firebase project id.');

    if (options.project && !options.bucket && env.VITE_FIREBASE_PROJECT_ID && projectId !== env.VITE_FIREBASE_PROJECT_ID) {
        throw new Error(
            `Project override "${projectId}" does not match .env.${envName} (${env.VITE_FIREBASE_PROJECT_ID}). ` +
            'Pass the matching --env or an explicit --bucket to avoid cross-environment writes.'
        );
    }

    const storageBucket = options.bucket || env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`;
    const appId = options.appId || env.VITE_APP_LOGICAL_NAME || sharedConfig.APP_ID || 'secondevie';
    const collections = options.collections?.length
        ? options.collections
        : (sharedConfig.PRODUCT_COLLECTIONS || ['furniture']);

    return { envName, projectId, storageBucket, appId, collections };
}

function isProductionTarget(runtime) {
    const productionEnv = safeParseEnvFile('production');
    return runtime.envName === 'production'
        || (productionEnv.VITE_FIREBASE_PROJECT_ID && runtime.projectId === productionEnv.VITE_FIREBASE_PROJECT_ID)
        || (productionEnv.VITE_FIREBASE_STORAGE_BUCKET && runtime.storageBucket === productionEnv.VITE_FIREBASE_STORAGE_BUCKET);
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
    return { credential: null, source: 'Application Default Credentials / Firebase environment' };
}

function initializeFirebase(runtime, options) {
    const credentialInfo = resolveCredential(options);
    const appOptions = {
        projectId: runtime.projectId,
        storageBucket: runtime.storageBucket,
    };
    if (credentialInfo.credential) appOptions.credential = credentialInfo.credential;
    if (!admin.apps.length) admin.initializeApp(appOptions);

    return {
        db: admin.firestore(),
        bucket: admin.storage().bucket(runtime.storageBucket),
        credentialSource: credentialInfo.source,
    };
}

function tryRequireSharp() {
    try {
        return require('sharp');
    } catch {
        throw new Error('Commit mode requires sharp. Install dependencies before running --commit.');
    }
}

function asArray(value) {
    return Array.isArray(value) ? [...value] : [];
}

function getProductImages(data) {
    const images = asArray(data.images).filter(Boolean);
    return images.length > 0 ? images : (data.imageUrl ? [data.imageUrl] : []);
}

function getVariantSlot(data, index) {
    const variants = asArray(data.imageVariants);
    const slot = variants[index];
    return slot && typeof slot === 'object' ? { ...slot } : {};
}

function isImageUrl(url) {
    return typeof url === 'string' && /^https?:\/\//i.test(url);
}

function parseFirebaseStorageUrl(url) {
    try {
        const parsed = new URL(url);
        if (parsed.hostname !== 'firebasestorage.googleapis.com') return null;
        const match = parsed.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
        if (!match) return null;
        return { bucket: decodeURIComponent(match[1]), path: decodeURIComponent(match[2]) };
    } catch {
        return null;
    }
}

function parseGsUrl(url) {
    if (typeof url !== 'string' || !url.startsWith('gs://')) return null;
    const withoutScheme = url.slice('gs://'.length);
    const slashIndex = withoutScheme.indexOf('/');
    if (slashIndex < 0) return null;
    return {
        bucket: withoutScheme.slice(0, slashIndex),
        path: withoutScheme.slice(slashIndex + 1),
    };
}

function getSourceInfo(url, targetBucketName) {
    const gsInfo = parseGsUrl(url);
    if (gsInfo) {
        return gsInfo.bucket === targetBucketName
            ? { type: 'storage', path: gsInfo.path, bucket: gsInfo.bucket, fingerprint: `storage:${gsInfo.path}` }
            : { type: 'external', url, fingerprint: `external:${url}` };
    }

    const firebaseInfo = parseFirebaseStorageUrl(url);
    if (firebaseInfo) {
        return firebaseInfo.bucket === targetBucketName
            ? { type: 'storage', path: firebaseInfo.path, bucket: firebaseInfo.bucket, fingerprint: `storage:${firebaseInfo.path}` }
            : { type: 'external', url, fingerprint: `external:${url}` };
    }

    if (isImageUrl(url)) return { type: 'external', url, fingerprint: `external:${url}` };
    return { type: 'unsupported', url, fingerprint: `unsupported:${url}` };
}

function sourceHash(source, spec) {
    return crypto
        .createHash('sha1')
        .update(`${source.fingerprint}|${spec.key}|w=${spec.width}|q=${spec.quality}`)
        .digest('hex')
        .slice(0, 12);
}

function sanitizeForPath(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[^\w.-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || 'image';
}

function buildVariantPath(collectionName, docId, index, source, spec) {
    const safeDocId = sanitizeForPath(docId);
    const hash = sourceHash(source, spec);
    return `${collectionName}/${spec.folder}/backfill_variant_${safeDocId}_${index}_${spec.key}_${hash}.webp`;
}

async function downloadSource(source, bucket) {
    if (source.type === 'storage') {
        const [buffer] = await bucket.file(source.path).download();
        return buffer;
    }

    if (source.type === 'external') {
        const response = await fetch(source.url, { redirect: 'follow' });
        if (!response.ok) throw new Error(`Download failed (${response.status})`);
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.toLowerCase().startsWith('image/')) {
            throw new Error(`URL is not an image (${contentType || 'unknown content-type'})`);
        }
        return Buffer.from(await response.arrayBuffer());
    }

    throw new Error('Unsupported image source');
}

async function createVariantBuffer(sourceBuffer, sharp, spec) {
    const result = await sharp(sourceBuffer)
        .rotate()
        .resize({ width: spec.width, withoutEnlargement: true })
        .webp({ quality: spec.quality, effort: 4 })
        .toBuffer({ resolveWithObject: true });

    return {
        buffer: result.data,
        width: result.info.width,
        height: result.info.height,
        bytes: result.info.size,
    };
}

function firebaseDownloadUrl(bucketName, filePath, token) {
    return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media&token=${token}`;
}

async function ensureDownloadToken(file) {
    const [metadata] = await file.getMetadata();
    const raw = metadata.metadata && metadata.metadata.firebaseStorageDownloadTokens;
    const token = raw ? String(raw).split(',')[0] : crypto.randomUUID();

    if (!raw) {
        await file.setMetadata({
            metadata: {
                ...(metadata.metadata || {}),
                firebaseStorageDownloadTokens: token,
            },
        });
    }

    return token;
}

async function uploadVariant(bucket, targetPath, variant, source, spec) {
    const file = bucket.file(targetPath);
    const [exists] = await file.exists();

    if (!exists) {
        const token = crypto.randomUUID();
        await file.save(variant.buffer, {
            resumable: false,
            metadata: {
                contentType: 'image/webp',
                cacheControl: CACHE_CONTROL,
                metadata: {
                    firebaseStorageDownloadTokens: token,
                    generatedBy: 'scripts/backfill-product-image-variants.cjs',
                    sourceFingerprint: source.fingerprint,
                    width: String(variant.width),
                    requestedWidth: String(spec.width),
                    height: String(variant.height),
                    quality: String(spec.quality),
                },
            },
        });
        return { url: firebaseDownloadUrl(bucket.name, targetPath, token), uploaded: true };
    }

    const token = await ensureDownloadToken(file);
    return { url: firebaseDownloadUrl(bucket.name, targetPath, token), uploaded: false };
}

function describeDocNeed(docSnap, collectionName, runtime, options) {
    const data = docSnap.data();
    const images = getProductImages(data);
    const needs = [];

    images.forEach((imageUrl, index) => {
        const existingVariant = getVariantSlot(data, index);
        const sourceUrl = existingVariant.full || imageUrl;
        const source = getSourceInfo(sourceUrl, runtime.storageBucket);

        const missingSpecs = VARIANT_SPECS.filter((spec) => options.force || !existingVariant[spec.key]);
        if (missingSpecs.length === 0) return;

        needs.push({
            index,
            sourceUrl,
            source,
            existingVariant,
            variants: missingSpecs.map((spec) => ({
                spec,
                targetPath: buildVariantPath(collectionName, docSnap.id, index, source, spec),
            })),
        });
    });

    return {
        ref: docSnap.ref,
        id: docSnap.id,
        collectionName,
        name: data.name || data.title || docSnap.id,
        images,
        existingVariants: asArray(data.imageVariants),
        needs,
    };
}

function addPreview(previews, item) {
    if (previews.length < PREVIEW_LIMIT) previews.push(item);
}

async function scan(runtime, firebase, options) {
    const stats = {
        docsScanned: 0,
        docsWithImages: 0,
        docsNeedingUpdate: 0,
        imageSlots: 0,
        variantSlotsMissing: 0,
        storageSources: 0,
        externalSources: 0,
        unsupportedSources: 0,
        wouldCreateVariants: 0,
        uploadedVariants: 0,
        reusedExistingFiles: 0,
        docsUpdated: 0,
        errors: 0,
    };
    const previews = [];
    const errors = [];
    const sharp = options.commit ? tryRequireSharp() : null;

    for (const collectionName of runtime.collections) {
        let query = firebase.db.collection(`artifacts/${runtime.appId}/public/data/${collectionName}`);
        if (options.publishedOnly) query = query.where('status', '==', 'published');
        if (options.limit !== null) query = query.limit(options.limit);

        const snapshot = await query.get();
        for (const docSnap of snapshot.docs) {
            stats.docsScanned++;
            const docNeed = describeDocNeed(docSnap, collectionName, runtime, options);
            stats.imageSlots += docNeed.images.length;
            if (docNeed.images.length > 0) stats.docsWithImages++;

            const missingCount = docNeed.needs.reduce((sum, need) => sum + need.variants.length, 0);
            stats.variantSlotsMissing += missingCount;
            stats.wouldCreateVariants += docNeed.needs
                .filter((need) => need.source.type !== 'unsupported')
                .reduce((sum, need) => sum + need.variants.length, 0);

            for (const need of docNeed.needs) {
                if (need.source.type === 'storage') stats.storageSources++;
                if (need.source.type === 'external') stats.externalSources++;
                if (need.source.type === 'unsupported') stats.unsupportedSources++;
            }

            if (missingCount === 0) continue;
            stats.docsNeedingUpdate++;
            addPreview(previews, {
                collectionName,
                id: docNeed.id,
                name: docNeed.name,
                imageIndexes: docNeed.needs.map((need) => need.index),
                missingVariants: docNeed.needs.flatMap((need) => need.variants.map((entry) => `${need.index}:${entry.spec.key}`)),
            });

            if (options.dryRun) continue;

            try {
                const nextImageVariants = [...docNeed.existingVariants];
                for (const need of docNeed.needs) {
                    if (need.source.type === 'unsupported') {
                        throw new Error(`Unsupported image URL at index ${need.index}: ${need.sourceUrl}`);
                    }

                    const sourceBuffer = await downloadSource(need.source, firebase.bucket);
                    const nextVariant = { ...need.existingVariant };

                    for (const { spec, targetPath } of need.variants) {
                        const variant = await createVariantBuffer(sourceBuffer, sharp, spec);
                        const uploadResult = await uploadVariant(firebase.bucket, targetPath, variant, need.source, spec);
                        nextVariant[spec.key] = uploadResult.url;
                        if (uploadResult.uploaded) stats.uploadedVariants++;
                        else stats.reusedExistingFiles++;
                        console.log(`  ${uploadResult.uploaded ? 'created' : 'reused'} ${targetPath} (${variant.width}x${variant.height}, ${variant.bytes} bytes)`);
                    }

                    nextImageVariants[need.index] = nextVariant;
                }

                await docNeed.ref.update({ imageVariants: nextImageVariants });
                stats.docsUpdated++;
            } catch (error) {
                stats.errors++;
                errors.push({
                    collectionName,
                    id: docNeed.id,
                    name: docNeed.name,
                    message: error.message,
                });
                console.error(`  error ${collectionName}/${docNeed.id}: ${error.message}`);
            }
        }
    }

    return { stats, previews, errors };
}

function printSummary(runtime, firebase, options, result) {
    const { stats, previews, errors } = result;
    console.log('\nProduct image variants backfill');
    console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'COMMIT'}`);
    console.log(`Env: ${runtime.envName}`);
    console.log(`Project: ${runtime.projectId}`);
    console.log(`Bucket: ${runtime.storageBucket}`);
    console.log(`App data path: artifacts/${runtime.appId}/public/data/{${runtime.collections.join(',')}}`);
    console.log(`Credentials: ${firebase.credentialSource}`);
    console.log(`Options: force=${options.force ? 'yes' : 'no'}, publishedOnly=${options.publishedOnly ? 'yes' : 'no'}`);

    console.log('\nStats');
    console.log(`Docs scanned: ${stats.docsScanned}`);
    console.log(`Docs with images: ${stats.docsWithImages}`);
    console.log(`Docs needing update: ${stats.docsNeedingUpdate}`);
    console.log(`Image slots: ${stats.imageSlots}`);
    console.log(`Missing variant slots: ${stats.variantSlotsMissing}`);
    console.log(`Sources: storage=${stats.storageSources}, external=${stats.externalSources}, unsupported=${stats.unsupportedSources}`);
    console.log(`${options.dryRun ? 'Would create' : 'Created'} variants: ${options.dryRun ? stats.wouldCreateVariants : stats.uploadedVariants}`);
    if (!options.dryRun) {
        console.log(`Reused existing generated files: ${stats.reusedExistingFiles}`);
        console.log(`Docs updated: ${stats.docsUpdated}`);
    }
    console.log(`Errors: ${stats.errors}`);

    if (previews.length > 0) {
        console.log(`\nPreview (${previews.length}/${Math.min(stats.docsNeedingUpdate, PREVIEW_LIMIT)} shown)`);
        for (const item of previews) {
            console.log(`- ${item.collectionName}/${item.id} "${item.name}" images=[${item.imageIndexes.join(',')}] variants=[${item.missingVariants.join(',')}]`);
        }
    }

    if (errors.length > 0) {
        console.log('\nErrors');
        for (const error of errors.slice(0, PREVIEW_LIMIT)) {
            console.log(`- ${error.collectionName}/${error.id} "${error.name}": ${error.message}`);
        }
    }

    if (options.dryRun) {
        console.log('\nNo writes performed. Re-run with --commit to create WebP variants and update Firestore imageVariants.');
    }
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
        printHelp();
        return;
    }

    const runtime = resolveRuntimeConfig(options);
    if (options.commit && isProductionTarget(runtime) && !options.allowProduction) {
        throw new Error('Production commit blocked. Re-run with --env=production --commit --allow-production if this is intentional.');
    }

    const firebase = initializeFirebase(runtime, options);
    const result = await scan(runtime, firebase, options);
    printSummary(runtime, firebase, options, result);

    if (result.stats.errors > 0 && options.commit) process.exitCode = 1;
}

main().catch((error) => {
    console.error(`\nProduct image variants backfill failed: ${error.message}`);
    process.exitCode = 1;
});
