#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { collectStoragePaths } = require('../functions/src/triggers/mediaCleanup');

const ROOT_DIR = path.resolve(__dirname, '..');
const FIREBASERC_PATH = path.join(ROOT_DIR, '.firebaserc');
const DEFAULT_SERVICE_ACCOUNT_PATH = path.join(ROOT_DIR, 'service-account.json');

let sharedConfig = { APP_ID: 'secondevie', PRODUCT_COLLECTIONS: ['furniture'] };
try {
    sharedConfig = require('../functions/helpers/config');
} catch {
    // Keep the script usable if helpers are unavailable.
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
        } else if (arg === '--allow-production') options.allowProduction = true;
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
        }
    }

    return options;
}

function printHelp() {
    console.log(`
Audit Firebase Storage product media orphans.

Dry-run is the default and never deletes files.

Usage:
  node scripts/audit-storage-orphans.cjs --dry-run
  node scripts/audit-storage-orphans.cjs --commit

Options:
  --env=sandbox|production      Reads .env.sandbox or .env.production. Default: sandbox.
  --project=<alias-or-id>       Overrides Firebase project id.
  --bucket=<bucket-name>        Overrides VITE_FIREBASE_STORAGE_BUCKET.
  --app-id=<id>                 Overrides VITE_APP_LOGICAL_NAME.
  --collections=furniture       Comma-separated product collections.
  --service-account=<path>      Optional Firebase service account JSON.
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
    if (!fs.existsSync(envPath)) {
        throw new Error(`Missing ${path.basename(envPath)}.`);
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

    const storageBucket = options.bucket || env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`;
    const appId = options.appId || env.VITE_APP_LOGICAL_NAME || sharedConfig.APP_ID || 'secondevie';
    const collections = options.collections?.length
        ? options.collections
        : (sharedConfig.PRODUCT_COLLECTIONS || ['furniture']);

    if (options.commit && options.env === 'production' && !options.allowProduction) {
        throw new Error('Refusing production deletion without --allow-production.');
    }

    return { projectId, storageBucket, appId, collections };
}

function resolveCredential(options) {
    const requestedPath = options.serviceAccount
        ? path.resolve(ROOT_DIR, options.serviceAccount)
        : DEFAULT_SERVICE_ACCOUNT_PATH;

    if (fs.existsSync(requestedPath)) {
        return admin.credential.cert(JSON.parse(fs.readFileSync(requestedPath, 'utf8')));
    }

    if (options.serviceAccount) {
        throw new Error(`Service account not found: ${requestedPath}`);
    }

    return admin.credential.applicationDefault();
}

async function listStoragePaths(bucket, prefixes) {
    const paths = new Set();

    for (const prefix of prefixes) {
        const [files] = await bucket.getFiles({ prefix });
        files.forEach((file) => paths.add(file.name));
    }

    return paths;
}

async function collectReferencedPaths(db, appId, collections) {
    const referenced = new Set();
    const counts = {};

    for (const collectionName of collections) {
        const ref = db.collection('artifacts').doc(appId).collection('public').doc('data').collection(collectionName);
        const snap = await ref.get();
        counts[collectionName] = snap.size;
        snap.forEach((doc) => {
            collectStoragePaths(doc.data()).forEach((filePath) => referenced.add(filePath));
        });
    }

    return { referenced, counts };
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
        printHelp();
        return;
    }

    const runtime = resolveRuntimeConfig(options);

    admin.initializeApp({
        credential: resolveCredential(options),
        projectId: runtime.projectId,
        storageBucket: runtime.storageBucket,
    });

    const db = admin.firestore();
    const bucket = admin.storage().bucket();
    const prefixes = runtime.collections.map((collectionName) => `${collectionName}/`);
    const storagePaths = await listStoragePaths(bucket, prefixes);
    const { referenced, counts } = await collectReferencedPaths(db, runtime.appId, runtime.collections);
    const orphans = Array.from(storagePaths).filter((filePath) => !referenced.has(filePath)).sort();

    console.log(JSON.stringify({
        mode: options.commit ? 'commit' : 'dry-run',
        projectId: runtime.projectId,
        storageBucket: runtime.storageBucket,
        appId: runtime.appId,
        collections: runtime.collections,
        documentCounts: counts,
        storageFileCount: storagePaths.size,
        referencedFileCount: referenced.size,
        orphanCount: orphans.length,
        orphans: orphans.slice(0, 200),
        truncated: orphans.length > 200,
    }, null, 2));

    if (!options.commit || orphans.length === 0) return;

    for (const filePath of orphans) {
        await bucket.file(filePath).delete().catch((error) => {
            if (error.code !== 404) throw error;
        });
        console.log(`deleted ${filePath}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
