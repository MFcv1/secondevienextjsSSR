#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const {
    ANALYTICS_DETAIL_RETENTION_DAYS,
    ANALYTICS_SESSION_RETENTION_DAYS,
    ANALYTICS_ROLLUP_RETENTION_DAYS,
    SYSTEM_DOC_RETENTION_DAYS
} = require('../functions/src/analytics/constants');

const ROOT_DIR = path.resolve(__dirname, '..');
const FIREBASERC_PATH = path.join(ROOT_DIR, '.firebaserc');

const DEFAULT_PAGE_SIZE = 400;
const PREVIEW_LIMIT = 40;

function parseArgs(argv) {
    const options = {
        commit: false,
        dryRun: true,
        pageSize: DEFAULT_PAGE_SIZE,
        project: null,
        collections: null
    };

    for (const arg of argv) {
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
        if (arg.startsWith('--project=')) {
            options.project = arg.split('=')[1] || null;
            continue;
        }
        if (arg.startsWith('--page-size=')) {
            const value = Number(arg.split('=')[1]);
            if (Number.isFinite(value) && value > 0) {
                options.pageSize = Math.min(Math.floor(value), 1000);
            }
            continue;
        }
        if (arg.startsWith('--collections=')) {
            const raw = arg.split('=')[1] || '';
            options.collections = raw.split(',').map((part) => part.trim()).filter(Boolean);
        }
    }

    return options;
}

function readFirebaseAliases() {
    if (!fs.existsSync(FIREBASERC_PATH)) {
        return {};
    }

    try {
        const parsed = JSON.parse(fs.readFileSync(FIREBASERC_PATH, 'utf8'));
        return parsed.projects || {};
    } catch (error) {
        console.warn('Impossible de lire .firebaserc:', error.message);
        return {};
    }
}

function resolveProjectId(rawProject) {
    const aliases = readFirebaseAliases();

    if (!rawProject) {
        return aliases.default || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || null;
    }

    return aliases[rawProject] || rawProject;
}

function isTimestampLike(value) {
    return Boolean(value)
        && typeof value.toMillis === 'function';
}

function toMillis(value) {
    if (!value) return null;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (value instanceof Date) return value.getTime();
    if (isTimestampLike(value)) return value.toMillis();
    if (typeof value === 'string') {
        const parsed = Date.parse(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    if (typeof value === 'object') {
        if (typeof value._seconds === 'number') {
            return (value._seconds * 1000) + Math.floor((value._nanoseconds || 0) / 1e6);
        }
        if (typeof value.seconds === 'number') {
            return (value.seconds * 1000) + Math.floor((value.nanoseconds || 0) / 1e6);
        }
    }
    return null;
}

function parseDateKey(value) {
    if (typeof value !== 'string') return null;
    const normalized = value.split('__')[0];
    const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;

    const [, year, month, day] = match;
    return Date.UTC(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
}

function getFieldMillis(data, fields) {
    for (const fieldName of fields) {
        const value = data[fieldName];
        const millis = toMillis(value);
        if (millis !== null) {
            return { fieldName, millis };
        }
    }
    return null;
}

function createTargets() {
    return [
        {
            name: 'analytics_sessions',
            recursive: true,
            retentionDays: ANALYTICS_SESSION_RETENTION_DAYS,
            timestampFields: ['expireAt', 'endedAt', 'lastActivityAt', 'startedAt', 'updatedAt', 'createdAt']
        },
        {
            name: 'analytics_item_daily',
            recursive: false,
            retentionDays: ANALYTICS_ROLLUP_RETENTION_DAYS,
            timestampFields: ['expireAt', 'lastTouchedAt', 'lastViewedAt', 'lastInteractedAt', 'updatedAt', 'createdAt'],
            dateKeyField: 'dateKey'
        },
        {
            name: 'sales_stats_daily',
            recursive: false,
            retentionDays: ANALYTICS_ROLLUP_RETENTION_DAYS,
            timestampFields: ['expireAt', 'lastUpdatedAt', 'updatedAt', 'createdAt'],
            dateKeyField: 'dateKey'
        },
        {
            name: 'sys_ratelimit',
            recursive: false,
            retentionDays: SYSTEM_DOC_RETENTION_DAYS,
            timestampFields: ['expireAt', 'lastReq', 'updatedAt', 'createdAt']
        },
        {
            name: 'sys_idempotency',
            recursive: false,
            retentionDays: SYSTEM_DOC_RETENTION_DAYS,
            timestampFields: ['expireAt', 'updatedAt', 'createdAt']
        }
    ];
}

function selectTargets(options) {
    const targets = createTargets();
    if (!options.collections || !options.collections.length) {
        return targets;
    }
    const wanted = new Set(options.collections);
    return targets.filter((target) => wanted.has(target.name));
}

function getDeletionReason(data, target, nowMillis) {
    const explicitExpiry = toMillis(data.expireAt);
    if (explicitExpiry !== null && explicitExpiry <= nowMillis) {
        return {
            reason: 'expireAt',
            referenceMillis: explicitExpiry
        };
    }

    const fallbackCutoff = nowMillis - (target.retentionDays * 24 * 60 * 60 * 1000);
    const datedField = getFieldMillis(data, target.timestampFields.filter((fieldName) => fieldName !== 'expireAt'));
    if (datedField && datedField.millis <= fallbackCutoff) {
        return {
            reason: datedField.fieldName,
            referenceMillis: datedField.millis
        };
    }

    if (target.dateKeyField) {
        const dateKeyMillis = parseDateKey(data[target.dateKeyField] || '');
        if (dateKeyMillis !== null && dateKeyMillis <= fallbackCutoff) {
            return {
                reason: target.dateKeyField,
                referenceMillis: dateKeyMillis
            };
        }
    }

    return null;
}

function formatMillis(millis) {
    if (!Number.isFinite(millis)) return 'n/a';
    return new Date(millis).toISOString();
}

async function collectCandidates(db, target, pageSize) {
    const allDocs = await db.collection(target.name).get();
    const nowMillis = Date.now();
    const candidates = [];
    const skipped = [];

    for (const docSnap of allDocs.docs) {
        const data = docSnap.data() || {};
        const deletionReason = getDeletionReason(data, target, nowMillis);

        if (!deletionReason) {
            skipped.push(docSnap.id);
            continue;
        }

        candidates.push({
            ref: docSnap.ref,
            path: docSnap.ref.path,
            recursive: target.recursive,
            reason: deletionReason.reason,
            referenceMillis: deletionReason.referenceMillis,
            preview: {
                id: docSnap.id,
                reason: deletionReason.reason,
                referenceAt: formatMillis(deletionReason.referenceMillis)
            }
        });
    }

    return {
        collectionName: target.name,
        scannedCount: allDocs.size,
        candidateCount: candidates.length,
        skippedCount: skipped.length,
        skippedPreview: skipped.slice(0, PREVIEW_LIMIT),
        candidates
    };
}

async function deleteCandidates(db, candidates, pageSize) {
    let deletedCount = 0;
    let recursiveCount = 0;
    let directCount = 0;

    const direct = candidates.filter((candidate) => !candidate.recursive);
    const recursive = candidates.filter((candidate) => candidate.recursive);

    for (let i = 0; i < direct.length; i += pageSize) {
        const chunk = direct.slice(i, i + pageSize);
        const batch = db.batch();
        chunk.forEach((candidate) => {
            batch.delete(candidate.ref);
        });
        await batch.commit();
        deletedCount += chunk.length;
        directCount += chunk.length;
    }

    for (const candidate of recursive) {
        await db.recursiveDelete(candidate.ref);
        deletedCount += 1;
        recursiveCount += 1;
    }

    return { deletedCount, directCount, recursiveCount };
}

function printReport(targetReport, isCommit) {
    console.log(`\n[${targetReport.collectionName}]`);
    console.log(`- scanned: ${targetReport.scannedCount}`);
    console.log(`- candidates: ${targetReport.candidateCount}`);
    console.log(`- skipped without safe expiry signal: ${targetReport.skippedCount}`);

    if (targetReport.skippedPreview.length) {
        console.log(`- skipped sample: ${targetReport.skippedPreview.join(', ')}`);
    }

    const previews = targetReport.candidates.slice(0, PREVIEW_LIMIT).map((candidate) => {
        return `  - ${candidate.path} | ${candidate.reason} | ${candidate.preview.referenceAt}`;
    });

    if (previews.length) {
        console.log('- candidate sample:');
        previews.forEach((line) => console.log(line));
    }

    if (isCommit && targetReport.deleted) {
        console.log(`- deleted: ${targetReport.deleted.deletedCount} (direct=${targetReport.deleted.directCount}, recursive=${targetReport.deleted.recursiveCount})`);
    }
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    const projectId = resolveProjectId(options.project);

    if (!projectId) {
        console.error("Projet Firebase introuvable. Utilise --project=prod, --project=default, ou renseigne .firebaserc.");
        process.exit(1);
    }

    try {
        admin.initializeApp({ projectId });
    } catch (error) {
        if (!admin.apps.length) {
            throw error;
        }
    }

    const db = admin.firestore();
    const targets = selectTargets(options);

    console.log(`Mode: ${options.commit ? 'COMMIT' : 'DRY-RUN'}`);
    console.log(`Projet: ${projectId}`);
    console.log(`Collections: ${targets.map((target) => target.name).join(', ')}`);

    const reports = [];
    for (const target of targets) {
        const report = await collectCandidates(db, target, options.pageSize);
        if (options.commit && report.candidates.length) {
            report.deleted = await deleteCandidates(db, report.candidates, options.pageSize);
        }
        reports.push(report);
        printReport(report, options.commit);
    }

    const summary = reports.reduce((acc, report) => {
        acc.scanned += report.scannedCount;
        acc.candidates += report.candidateCount;
        acc.deleted += report.deleted ? report.deleted.deletedCount : 0;
        return acc;
    }, { scanned: 0, candidates: 0, deleted: 0 });

    console.log('\nResume global');
    console.log(`- scanned: ${summary.scanned}`);
    console.log(`- candidates: ${summary.candidates}`);
    if (options.commit) {
        console.log(`- deleted: ${summary.deleted}`);
    } else {
        console.log('- deleted: 0 (dry-run)');
        console.log('\nPour executer la purge:');
        console.log(`node scripts/purge-expired-firestore.cjs --project=${projectId} --commit`);
    }
}

main().catch((error) => {
    console.error('\nEchec de la purge Firestore:');
    console.error(error && error.stack ? error.stack : error);
    console.error("\nAstuce: en local, il faut souvent un acces ADC via 'gcloud auth application-default login' ou une variable GOOGLE_APPLICATION_CREDENTIALS.");
    process.exit(1);
});
