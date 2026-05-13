#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const admin = require('firebase-admin');

const ROOT_DIR = path.resolve(__dirname, '..');
const FIREBASERC_PATH = path.join(ROOT_DIR, '.firebaserc');
const DEFAULT_SERVICE_ACCOUNT_PATH = path.join(ROOT_DIR, 'service-account.json');
const BLUR_WIDTH = 28;

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
        env: 'sandbox',
        project: null,
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
        else if (arg.startsWith('--env=')) options.env = arg.split('=')[1] || 'sandbox';
        else if (arg.startsWith('--project=')) options.project = arg.split('=')[1] || null;
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
Backfill product imageMetadata documents.

Dry-run is the default and only reports missing metadata. Commit mode downloads
the source images, computes width/height/ratio/dominantColor/blurDataUrl, updates
the product document and bumps public/meta.catalogVersion.

Usage:
  node scripts/backfill-product-image-metadata.cjs --dry-run
  node scripts/backfill-product-image-metadata.cjs --commit

Options:
  --env=sandbox|production      Reads .env.sandbox or .env.production. Default: sandbox.
  --project=<alias-or-id>       Overrides Firebase project id. Alias comes from .firebaserc.
  --app-id=<id>                 Overrides VITE_APP_LOGICAL_NAME.
  --collections=furniture       Comma-separated product collections.
  --service-account=<path>      Optional Firebase service account JSON.
  --limit=<n>                   Process at most n documents per collection.
  --published-only              Process only docs where status == published.
  --force                       Recompute slots even when metadata already exists.
  --allow-production            Required with --commit --env=production.
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

    const appId = options.appId || env.VITE_APP_LOGICAL_NAME || sharedConfig.APP_ID || 'secondevie';
    const collections = options.collections?.length
        ? options.collections
        : (sharedConfig.PRODUCT_COLLECTIONS || ['furniture']);

    return { envName: options.env, projectId, appId, collections };
}

function isProductionTarget(runtime) {
    const productionEnv = safeParseEnvFile('production');
    return runtime.envName === 'production'
        || (productionEnv.VITE_FIREBASE_PROJECT_ID && runtime.projectId === productionEnv.VITE_FIREBASE_PROJECT_ID);
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
    const appOptions = { projectId: runtime.projectId };
    if (credentialInfo.credential) appOptions.credential = credentialInfo.credential;
    if (!admin.apps.length) admin.initializeApp(appOptions);

    return {
        db: admin.firestore(),
        credentialSource: credentialInfo.source,
    };
}

function getImageCandidates(data, index) {
    const variants = Array.isArray(data.imageVariants) ? data.imageVariants[index] : null;
    return [
        variants?.full,
        variants?.large,
        variants?.medium,
        variants?.card,
        variants?.thumb,
        Array.isArray(data.images) ? data.images[index] : null,
        Array.isArray(data.thumbnails) ? data.thumbnails[index] : null,
        index === 0 ? data.imageUrl : null,
        index === 0 ? data.thumbnailUrl : null,
    ].filter((url) => typeof url === 'string' && /^https?:\/\//i.test(url));
}

function getImageSlotCount(data) {
    return Math.max(
        Array.isArray(data.images) ? data.images.length : 0,
        Array.isArray(data.thumbnails) ? data.thumbnails.length : 0,
        Array.isArray(data.imageVariants) ? data.imageVariants.length : 0,
        data.imageUrl ? 1 : 0
    );
}

function hasCompleteMetadata(slot) {
    return Boolean(
        slot
        && Number.isFinite(Number(slot.width))
        && Number.isFinite(Number(slot.height))
        && Number.isFinite(Number(slot.ratio))
        && typeof slot.dominantColor === 'string'
        && slot.dominantColor
        && typeof slot.blurDataUrl === 'string'
        && slot.blurDataUrl
    );
}

async function downloadBuffer(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
}

function averageRgb(rawBuffer) {
    let red = 0;
    let green = 0;
    let blue = 0;
    let count = 0;

    for (let index = 0; index < rawBuffer.length; index += 3) {
        red += rawBuffer[index];
        green += rawBuffer[index + 1];
        blue += rawBuffer[index + 2];
        count += 1;
    }

    if (!count) return '#f7f3ee';
    return `rgb(${Math.round(red / count)}, ${Math.round(green / count)}, ${Math.round(blue / count)})`;
}

async function computeMetadata(url) {
    const sharp = require('sharp');
    const sourceBuffer = await downloadBuffer(url);
    const image = sharp(sourceBuffer, { failOn: 'none' }).rotate();
    const metadata = await image.metadata();
    const width = Number(metadata.width || 0);
    const height = Number(metadata.height || 0);
    if (!width || !height) throw new Error('Missing image dimensions');

    const raw = await sharp(sourceBuffer, { failOn: 'none' })
        .rotate()
        .resize(12, 12, { fit: 'inside', withoutEnlargement: true })
        .removeAlpha()
        .raw()
        .toBuffer();

    const blurBuffer = await sharp(sourceBuffer, { failOn: 'none' })
        .rotate()
        .resize(BLUR_WIDTH, null, { fit: 'inside', withoutEnlargement: true })
        .blur(3)
        .webp({ quality: 35 })
        .toBuffer();

    return {
        width,
        height,
        ratio: Number((width / height).toFixed(4)),
        dominantColor: averageRgb(raw),
        blurDataUrl: `data:image/webp;base64,${blurBuffer.toString('base64')}`,
    };
}

async function readProducts(db, runtime, collectionName, options) {
    let ref = db
        .collection('artifacts')
        .doc(runtime.appId)
        .collection('public')
        .doc('data')
        .collection(collectionName);

    if (options.publishedOnly) ref = ref.where('status', '==', 'published');
    if (options.limit) ref = ref.limit(options.limit);

    const snapshot = await ref.get();
    return snapshot.docs;
}

async function bumpCatalogVersion(db, runtime, reason) {
    await db
        .collection('artifacts')
        .doc(runtime.appId)
        .collection('public')
        .doc('meta')
        .set({
            catalogVersion: admin.firestore.FieldValue.serverTimestamp(),
            catalogVersionReason: reason,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
}

async function processDoc(doc, options) {
    const data = doc.data();
    const slotCount = getImageSlotCount(data);
    const existing = Array.isArray(data.imageMetadata) ? [...data.imageMetadata] : [];
    const missingSlots = [];

    for (let index = 0; index < slotCount; index += 1) {
        if (options.force || !hasCompleteMetadata(existing[index])) {
            missingSlots.push(index);
        }
    }

    if (!missingSlots.length) return { status: 'skip', missingSlots };
    if (options.dryRun) return { status: 'pending', missingSlots };

    const nextMetadata = [...existing];
    for (const index of missingSlots) {
        const candidates = getImageCandidates(data, index);
        if (!candidates.length) {
            nextMetadata[index] = { ...(nextMetadata[index] || {}), error: 'no_source_url' };
            continue;
        }

        let computed = null;
        let lastError = null;
        for (const url of candidates) {
            try {
                computed = await computeMetadata(url);
                break;
            } catch (error) {
                lastError = error;
            }
        }

        if (!computed) {
            nextMetadata[index] = {
                ...(nextMetadata[index] || {}),
                error: lastError?.message || 'metadata_failed',
            };
            continue;
        }

        nextMetadata[index] = {
            ...(nextMetadata[index] || {}),
            ...computed,
            updatedAt: new Date().toISOString(),
        };
    }

    await doc.ref.update({ imageMetadata: nextMetadata });
    return { status: 'updated', missingSlots };
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
        printHelp();
        return;
    }

    const runtime = resolveRuntimeConfig(options);
    if (options.commit && isProductionTarget(runtime) && !options.allowProduction) {
        throw new Error('Refusing production commit without --allow-production.');
    }

    const { db, credentialSource } = initializeFirebase(runtime, options);
    const summary = {
        env: runtime.envName,
        projectId: runtime.projectId,
        appId: runtime.appId,
        credentialSource,
        mode: options.commit ? 'commit' : 'dry-run',
        collections: {},
    };

    let updatedCount = 0;

    for (const collectionName of runtime.collections) {
        const docs = await readProducts(db, runtime, collectionName, options);
        const collectionSummary = {
            scanned: docs.length,
            pending: 0,
            updated: 0,
            skipped: 0,
            failed: 0,
            preview: [],
        };

        for (const doc of docs) {
            try {
                const result = await processDoc(doc, options);
                collectionSummary[`${result.status === 'skip' ? 'skipped' : result.status}`] += 1;
                if (result.status === 'updated') updatedCount += 1;
                if (result.status !== 'skip' && collectionSummary.preview.length < 20) {
                    collectionSummary.preview.push({
                        id: doc.id,
                        missingSlots: result.missingSlots,
                    });
                }
            } catch (error) {
                collectionSummary.failed += 1;
                if (collectionSummary.preview.length < 20) {
                    collectionSummary.preview.push({ id: doc.id, error: error.message });
                }
            }
        }

        summary.collections[collectionName] = collectionSummary;
    }

    if (options.commit && updatedCount > 0) {
        await bumpCatalogVersion(db, runtime, 'image_metadata_backfill');
        summary.catalogVersionBumped = true;
    }

    console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
