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

let sharedConfig = { APP_ID: 'secondevie', PRODUCT_COLLECTIONS: ['furniture'] };
try {
    sharedConfig = require('../functions/helpers/config');
} catch {
    // Keep the script usable even if functions/helpers is not present.
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
        maxWidth: 640,
        quality: 74,
        allowProduction: false,
        help: false,
    };

    for (const arg of argv) {
        if (arg === '--help' || arg === '-h') {
            options.help = true;
            continue;
        }
        if (arg === '--commit') {
            options.commit = true;
            options.dryRun = false;
            continue;
        }
        if (arg === '--dry-run') {
            options.commit = false;
            options.dryRun = true;
            continue;
        }
        if (arg === '--force') {
            options.force = true;
            continue;
        }
        if (arg === '--allow-production') {
            options.allowProduction = true;
            continue;
        }
        if (arg.startsWith('--env=')) {
            options.env = arg.split('=')[1] || null;
            continue;
        }
        if (arg.startsWith('--project=')) {
            options.project = arg.split('=')[1] || null;
            continue;
        }
        if (arg.startsWith('--bucket=')) {
            options.bucket = arg.split('=')[1] || null;
            continue;
        }
        if (arg.startsWith('--app-id=')) {
            options.appId = arg.split('=')[1] || null;
            continue;
        }
        if (arg.startsWith('--collections=')) {
            const raw = arg.split('=')[1] || '';
            options.collections = raw.split(',').map((part) => part.trim()).filter(Boolean);
            continue;
        }
        if (arg.startsWith('--service-account=')) {
            options.serviceAccount = arg.split('=')[1] || null;
            continue;
        }
        if (arg.startsWith('--limit=')) {
            const value = Number(arg.split('=')[1]);
            if (Number.isFinite(value) && value >= 0) {
                options.limit = Math.floor(value);
            }
            continue;
        }
        if (arg.startsWith('--max-width=')) {
            const value = Number(arg.split('=')[1]);
            if (Number.isFinite(value) && value > 0) {
                options.maxWidth = Math.floor(value);
            }
            continue;
        }
        if (arg.startsWith('--quality=')) {
            const value = Number(arg.split('=')[1]);
            if (Number.isFinite(value) && value > 0 && value <= 100) {
                options.quality = Math.floor(value);
            }
        }
    }

    return options;
}

function printHelp() {
    console.log(`
Backfill product thumbnails in Firebase Storage.

Dry-run is the default and does not download, upload, or update documents.

Usage:
  node scripts/backfill-product-thumbnails.cjs [--dry-run]
  node scripts/backfill-product-thumbnails.cjs --commit

Options:
  --env=sandbox|production      Reads .env.sandbox or .env.production. Default: sandbox.
  --project=<alias-or-id>       Overrides the project id. Alias comes from .firebaserc.
  --bucket=<bucket-name>        Overrides VITE_FIREBASE_STORAGE_BUCKET.
  --app-id=<id>                 Overrides VITE_APP_LOGICAL_NAME.
  --collections=furniture       Comma-separated product collections. Default: functions config.
  --service-account=<path>      Optional Firebase service account JSON.
  --limit=<n>                   Process at most n documents per collection.
  --max-width=<px>              Thumbnail max width. Default: 640.
  --quality=<1-100>             WebP quality. Default: 74.
  --force                       Generate thumbnails even when a slot already has one.
  --allow-production            Required with --commit --env=production.

Commit mode requires the optional package "sharp" to be installed.
`);
}

function readFirebaseAliases() {
    if (!fs.existsSync(FIREBASERC_PATH)) {
        return {};
    }

    try {
        const parsed = JSON.parse(fs.readFileSync(FIREBASERC_PATH, 'utf8'));
        return parsed.projects || {};
    } catch (error) {
        console.warn('Unable to read .firebaserc:', error.message);
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
    if (!fs.existsSync(envPath)) {
        throw new Error(`Missing ${path.basename(envPath)}. Expected one of .env.sandbox or .env.production.`);
    }

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
    if (!projectId) {
        throw new Error('Unable to resolve Firebase project id.');
    }

    if (options.project && !options.bucket && env.VITE_FIREBASE_PROJECT_ID && projectId !== env.VITE_FIREBASE_PROJECT_ID) {
        throw new Error(
            `Project override "${projectId}" does not match .env.${envName} (${env.VITE_FIREBASE_PROJECT_ID}). ` +
            'Pass the matching --env or an explicit --bucket to avoid cross-environment writes.'
        );
    }

    const storageBucket = options.bucket || env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`;
    const appId = options.appId || env.VITE_APP_LOGICAL_NAME || sharedConfig.APP_ID || 'secondevie';
    const collections = options.collections && options.collections.length > 0
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
        const serviceAccount = JSON.parse(fs.readFileSync(requestedPath, 'utf8'));
        return {
            credential: admin.credential.cert(serviceAccount),
            source: path.relative(ROOT_DIR, requestedPath),
        };
    }

    if (options.serviceAccount) {
        throw new Error(`Service account not found: ${requestedPath}`);
    }

    return { credential: null, source: 'Application Default Credentials / Firebase environment' };
}

function initializeFirebase(runtime, options) {
    const credentialInfo = resolveCredential(options);
    const appOptions = {
        projectId: runtime.projectId,
        storageBucket: runtime.storageBucket,
    };
    if (credentialInfo.credential) {
        appOptions.credential = credentialInfo.credential;
    }

    if (!admin.apps.length) {
        admin.initializeApp(appOptions);
    }

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
        throw new Error(
            'Commit mode requires the optional package "sharp" to create WebP thumbnails. ' +
            'It is not installed in this repo. Add it intentionally before running --commit.'
        );
    }
}

function asArray(value) {
    return Array.isArray(value) ? [...value] : [];
}

function getProductImages(data) {
    const images = asArray(data.images);
    return images.length > 0 ? images : (data.imageUrl ? [data.imageUrl] : []);
}

function getThumbnailSlot(data, index) {
    const thumbnails = asArray(data.thumbnails);
    return thumbnails[index] || (index === 0 ? data.thumbnailUrl : null) || '';
}

function hasUsableThumbnail(data, index) {
    return Boolean(getThumbnailSlot(data, index));
}

function isSameUrl(a, b) {
    return Boolean(a && b && String(a).trim() === String(b).trim());
}

function isImageUrl(url) {
    return typeof url === 'string' && /^https?:\/\//i.test(url);
}

function parseFirebaseStorageUrl(url) {
    try {
        const parsed = new URL(url);
        if (parsed.hostname !== 'firebasestorage.googleapis.com') {
            return null;
        }
        const match = parsed.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
        if (!match) {
            return null;
        }
        return {
            bucket: decodeURIComponent(match[1]),
            path: decodeURIComponent(match[2]),
        };
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
            ? { type: 'storage', path: gsInfo.path, bucket: gsInfo.bucket }
            : { type: 'external', url };
    }

    const firebaseInfo = parseFirebaseStorageUrl(url);
    if (firebaseInfo) {
        return firebaseInfo.bucket === targetBucketName
            ? { type: 'storage', path: firebaseInfo.path, bucket: firebaseInfo.bucket }
            : { type: 'external', url };
    }

    if (isImageUrl(url)) {
        return { type: 'external', url };
    }

    return { type: 'unsupported', url };
}

function sourceHash(url, maxWidth, quality) {
    return crypto
        .createHash('sha1')
        .update(`${url}|w=${maxWidth}|q=${quality}`)
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

function buildThumbnailPath(collectionName, docId, index, url, options) {
    const safeDocId = sanitizeForPath(docId);
    const hash = sourceHash(url, options.maxWidth, options.quality);
    return `${collectionName}/thumbnails/backfill_${safeDocId}_${index}_${hash}.webp`;
}

async function downloadSource(source, bucket) {
    if (source.type === 'storage') {
        const [buffer] = await bucket.file(source.path).download();
        return buffer;
    }

    if (source.type === 'external') {
        const response = await fetch(source.url, { redirect: 'follow' });
        if (!response.ok) {
            throw new Error(`Download failed (${response.status})`);
        }
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.toLowerCase().startsWith('image/')) {
            throw new Error(`URL is not an image (${contentType || 'unknown content-type'})`);
        }
        return Buffer.from(await response.arrayBuffer());
    }

    throw new Error('Unsupported image source');
}

async function createThumbnailBuffer(sourceBuffer, sharp, options) {
    const result = await sharp(sourceBuffer)
        .rotate()
        .resize({ width: options.maxWidth, withoutEnlargement: true })
        .webp({ quality: options.quality, effort: 4 })
        .toBuffer({ resolveWithObject: true });

    return {
        buffer: result.data,
        width: result.info.width,
        height: result.info.height,
        bytes: result.info.size,
    };
}

function firebaseDownloadUrl(bucketName, filePath, token) {
    const encodedPath = encodeURIComponent(filePath);
    return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${token}`;
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

async function uploadThumbnail(bucket, targetPath, thumbnail, sourceUrl, options) {
    const file = bucket.file(targetPath);
    const [exists] = await file.exists();

    if (!exists) {
        const token = crypto.randomUUID();
        await file.save(thumbnail.buffer, {
            resumable: false,
            metadata: {
                contentType: 'image/webp',
                cacheControl: CACHE_CONTROL,
                metadata: {
                    firebaseStorageDownloadTokens: token,
                    generatedBy: 'scripts/backfill-product-thumbnails.cjs',
                    sourceHash: sourceHash(sourceUrl, options.maxWidth, options.quality),
                    sourceUrl,
                    width: String(thumbnail.width),
                    height: String(thumbnail.height),
                },
            },
        });
        return {
            url: firebaseDownloadUrl(bucket.name, targetPath, token),
            uploaded: true,
        };
    }

    const token = await ensureDownloadToken(file);
    return {
        url: firebaseDownloadUrl(bucket.name, targetPath, token),
        uploaded: false,
    };
}

function shouldGenerateSlot(data, imageUrl, index, options) {
    if (!imageUrl) return false;
    if (options.force) return true;
    if (!hasUsableThumbnail(data, index)) return true;

    const slotThumbnail = getThumbnailSlot(data, index);
    return isSameUrl(slotThumbnail, imageUrl);
}

function describeDocNeed(docSnap, collectionName, runtime, options) {
    const data = docSnap.data();
    const images = getProductImages(data);
    const needs = [];

    images.forEach((imageUrl, index) => {
        if (!shouldGenerateSlot(data, imageUrl, index, options)) return;
        const source = getSourceInfo(imageUrl, runtime.storageBucket);
        needs.push({
            index,
            imageUrl,
            source,
            targetPath: buildThumbnailPath(collectionName, docSnap.id, index, imageUrl, options),
        });
    });

    const needsThumbnailUrl = Boolean(images[0]) && (!data.thumbnailUrl || options.force);
    return {
        ref: docSnap.ref,
        id: docSnap.id,
        collectionName,
        name: data.name || docSnap.id,
        images,
        thumbnails: asArray(data.thumbnails),
        thumbnailUrl: data.thumbnailUrl || '',
        needs,
        needsThumbnailUrl,
    };
}

function addPreview(previews, item) {
    if (previews.length < PREVIEW_LIMIT) {
        previews.push(item);
    }
}

async function scan(runtime, firebase, options) {
    const stats = {
        docsScanned: 0,
        docsWithImages: 0,
        docsNeedingUpdate: 0,
        imageSlots: 0,
        thumbnailSlotsPresent: 0,
        thumbnailSlotsMissing: 0,
        thumbnailSlotsSelfReferential: 0,
        storageSources: 0,
        externalSources: 0,
        unsupportedSources: 0,
        wouldUpload: 0,
        uploaded: 0,
        reusedExistingFiles: 0,
        docsUpdated: 0,
        errors: 0,
    };
    const previews = [];
    const errors = [];
    const sharp = options.commit ? tryRequireSharp() : null;

    for (const collectionName of runtime.collections) {
        let query = firebase.db.collection(`artifacts/${runtime.appId}/public/data/${collectionName}`);
        if (options.limit !== null) {
            query = query.limit(options.limit);
        }

        const snapshot = await query.get();
        for (const docSnap of snapshot.docs) {
            stats.docsScanned++;
            const docNeed = describeDocNeed(docSnap, collectionName, runtime, options);
            const data = docSnap.data();
            stats.imageSlots += docNeed.images.length;
            stats.thumbnailSlotsPresent += docNeed.images.filter((imageUrl, index) => imageUrl && hasUsableThumbnail(data, index)).length;
            stats.thumbnailSlotsMissing += docNeed.images.filter((imageUrl, index) => imageUrl && !hasUsableThumbnail(data, index)).length;
            stats.thumbnailSlotsSelfReferential += docNeed.images.filter((imageUrl, index) => imageUrl && isSameUrl(getThumbnailSlot(data, index), imageUrl)).length;
            if (docNeed.images.length > 0) stats.docsWithImages++;

            for (const need of docNeed.needs) {
                if (need.source.type === 'storage') stats.storageSources++;
                if (need.source.type === 'external') stats.externalSources++;
                if (need.source.type === 'unsupported') stats.unsupportedSources++;
            }

            if (docNeed.needs.length === 0 && !docNeed.needsThumbnailUrl) {
                continue;
            }

            stats.docsNeedingUpdate++;
            stats.wouldUpload += docNeed.needs.filter((need) => need.source.type !== 'unsupported').length;
            addPreview(previews, {
                collectionName,
                id: docNeed.id,
                name: docNeed.name,
                missingSlots: docNeed.needs.map((need) => need.index),
                needsThumbnailUrl: docNeed.needsThumbnailUrl,
            });

            if (options.dryRun) {
                continue;
            }

            try {
                const nextThumbnails = [...docNeed.thumbnails];
                for (const need of docNeed.needs) {
                    if (need.source.type === 'unsupported') {
                        throw new Error(`Unsupported image URL at index ${need.index}: ${need.imageUrl}`);
                    }

                    const sourceBuffer = await downloadSource(need.source, firebase.bucket);
                    const thumbnail = await createThumbnailBuffer(sourceBuffer, sharp, options);
                    const uploadResult = await uploadThumbnail(firebase.bucket, need.targetPath, thumbnail, need.imageUrl, options);
                    nextThumbnails[need.index] = uploadResult.url;
                    if (uploadResult.uploaded) stats.uploaded++;
                    else stats.reusedExistingFiles++;

                    console.log(`  ${uploadResult.uploaded ? 'created' : 'reused'} ${need.targetPath} (${thumbnail.width}x${thumbnail.height}, ${thumbnail.bytes} bytes)`);
                }

                const update = {};
                if (docNeed.needs.length > 0) {
                    update.thumbnails = nextThumbnails;
                }
                if ((docNeed.needsThumbnailUrl || options.force) && (nextThumbnails[0] || docNeed.images[0])) {
                    update.thumbnailUrl = nextThumbnails[0] || docNeed.images[0];
                }

                if (Object.keys(update).length > 0) {
                    await docNeed.ref.update(update);
                    stats.docsUpdated++;
                }
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
    console.log('\nProduct thumbnail backfill');
    console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'COMMIT'}`);
    console.log(`Env: ${runtime.envName}`);
    console.log(`Project: ${runtime.projectId}`);
    console.log(`Bucket: ${runtime.storageBucket}`);
    console.log(`App data path: artifacts/${runtime.appId}/public/data/{${runtime.collections.join(',')}}`);
    console.log(`Credentials: ${firebase.credentialSource}`);
    console.log(`Options: maxWidth=${options.maxWidth}, quality=${options.quality}, force=${options.force ? 'yes' : 'no'}`);

    console.log('\nStats');
    console.log(`Docs scanned: ${stats.docsScanned}`);
    console.log(`Docs with images: ${stats.docsWithImages}`);
    console.log(`Docs needing update: ${stats.docsNeedingUpdate}`);
    console.log(`Image slots: ${stats.imageSlots}`);
    console.log(`Thumbnail slots present: ${stats.thumbnailSlotsPresent}`);
    console.log(`Thumbnail slots missing: ${stats.thumbnailSlotsMissing}`);
    console.log(`Thumbnail slots using full image: ${stats.thumbnailSlotsSelfReferential}`);
    console.log(`Sources: storage=${stats.storageSources}, external=${stats.externalSources}, unsupported=${stats.unsupportedSources}`);
    console.log(`${options.dryRun ? 'Would upload' : 'Uploaded'} thumbnails: ${options.dryRun ? stats.wouldUpload : stats.uploaded}`);
    if (!options.dryRun) {
        console.log(`Reused existing generated files: ${stats.reusedExistingFiles}`);
        console.log(`Docs updated: ${stats.docsUpdated}`);
    }
    console.log(`Errors: ${stats.errors}`);

    if (previews.length > 0) {
        console.log(`\nPreview (${previews.length}/${Math.min(stats.docsNeedingUpdate, PREVIEW_LIMIT)} shown)`);
        for (const item of previews) {
            console.log(`- ${item.collectionName}/${item.id} "${item.name}" slots=[${item.missingSlots.join(',') || 'none'}] thumbnailUrl=${item.needsThumbnailUrl ? 'update' : 'ok'}`);
        }
    }

    if (errors.length > 0) {
        console.log('\nErrors');
        for (const error of errors.slice(0, PREVIEW_LIMIT)) {
            console.log(`- ${error.collectionName}/${error.id} "${error.name}": ${error.message}`);
        }
    }

    if (options.dryRun) {
        console.log('\nNo writes performed. Re-run with --commit to create WebP thumbnails and update Firestore.');
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

    if (result.stats.errors > 0 && options.commit) {
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error(`\nThumbnail backfill failed: ${error.message}`);
    process.exitCode = 1;
});
