'use strict';

// One transactional owner, no collection scan in the event path.
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const admin = require('firebase-admin');
const { hashOpaque } = require('../../helpers/observability');
const MINUTE = 60000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const SIZE = 1024;
const RANKS = 64;
const MAX_BYTES = 256 * 1024;
const FIELDS = ['sessions', 'duration', 'bounces', 'mobile'];
const LIMITS = { minute: 61, hour: 25, day: 31, month: 13, year: 50 };
const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit'
});

function dateKey(ms) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(ms)).map(p => [p.type, p.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
}
function keysFor(ms) {
    const day = dateKey(ms);
    return [`minute_${Math.floor(ms / MINUTE)}`, `hour_${Math.floor(ms / HOUR)}`,
        `day_${day}`, `month_${day.slice(0, 7)}`, `year_${day.slice(0, 4)}`];
}
function hash(value) { return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex'); }
function millis(value) {
    return typeof value?.toMillis === 'function' ? value.toMillis()
        : Number.isFinite(value?.seconds) ? value.seconds * 1000 + (value.nanoseconds || 0) / 1e6 : Number(value);
}
function version(value) {
    if (!Number.isSafeInteger(value?.seconds) || !Number.isSafeInteger(value?.nanoseconds)
        || value.nanoseconds < 0 || value.nanoseconds >= 1e9) throw new Error('DATA_SOURCE_VERSION_INVALID');
    return { seconds: value.seconds, nanoseconds: value.nanoseconds };
}
function point(subject) {
    const digest = crypto.createHash('sha256').update(subject).digest();
    let rank = 1;
    for (let i = 2; i < digest.length; i += 1) {
        if (!digest[i]) rank += 8;
        else { rank += Math.clz32(digest[i]) - 24; break; }
    }
    return { index: digest.readUInt16BE(0) & (SIZE - 1), rank: Math.min(RANKS - 1, rank) };
}
function contribution(sessionId, data) {
    if (!data || data.type === 'admin') return null;
    const startedAtMs = millis(data.startedAt);
    if (!Number.isSafeInteger(startedAtMs) || startedAtMs <= 0) throw new Error('DATA_START_INVALID');
    // Heartbeats change duration, not traffic. Duration/bounce become final on close.
    const closed = data.sessionActive === false;
    const duration = closed ? Math.max(0, Math.min(86400, Math.round(Number(data.duration) || 0))) : 0;
    const steps = Math.max(Number(data.journeyCount) || 0, data.journey?.length || 0);
    return {
        startedAtMs, keys: keysFor(startedAtMs), point: point(hashOpaque(data.userId || sessionId)),
        sessions: 1, duration, bounces: closed && (steps <= 1 || duration < 10) ? 1 : 0,
        mobile: data.device === 'Mobile' ? 1 : 0
    };
}

function zero() { return { sessions: 0, duration: 0, bounces: 0, mobile: 0 }; }
function decodeHistogram(value) {
    if (!value) return Buffer.alloc(SIZE * RANKS * 4);
    const raw = zlib.inflateSync(Buffer.from(value, 'base64'), { maxOutputLength: SIZE * RANKS * 4 });
    if (raw.length !== SIZE * RANKS * 4) throw new Error('DATA_HISTOGRAM_INVALID');
    return raw;
}
function mergeSketch(left, right) {
    const a = Buffer.from(left || Buffer.alloc(SIZE).toString('base64'), 'base64');
    const b = Buffer.from(right || Buffer.alloc(SIZE).toString('base64'), 'base64');
    if (a.length !== SIZE || b.length !== SIZE) throw new Error('DATA_SKETCH_INVALID');
    for (let i = 0; i < SIZE; i += 1) a[i] = Math.max(a[i], b[i]);
    return a.toString('base64');
}
function changeBucket(current, previous, next) {
    const result = { ...zero(), ...current };
    const histogram = decodeHistogram(current?.histogram);
    for (const [entry, sign] of [[previous, -1], [next, 1]]) {
        if (!entry) continue;
        for (const field of FIELDS) {
            result[field] += sign * entry[field];
            if (!Number.isSafeInteger(result[field]) || result[field] < 0) throw new Error('DATA_COUNTER_INVALID');
        }
        const { index, rank } = entry.point;
        if (!Number.isInteger(index) || index < 0 || index >= SIZE || !Number.isInteger(rank) || rank < 1 || rank >= RANKS) {
            throw new Error('DATA_POINT_INVALID');
        }
        const offset = (index * RANKS + rank) * 4;
        const count = histogram.readUInt32LE(offset) + sign;
        if (count < 0 || count > 0xffffffff) throw new Error('DATA_REGISTER_COUNT_INVALID');
        histogram.writeUInt32LE(count, offset);
    }
    const sketch = Buffer.alloc(SIZE);
    for (let i = 0; i < SIZE; i += 1) {
        for (let rank = RANKS - 1; rank > 0; rank -= 1) {
            if (histogram.readUInt32LE((i * RANKS + rank) * 4)) { sketch[i] = rank; break; }
        }
    }
    result.histogram = zlib.deflateSync(histogram).toString('base64');
    result.uniqueHll = mergeSketch(result.baselineHll, sketch.toString('base64'));
    assertSize(result);
    return result;
}
function assertSize(doc) {
    if (Buffer.byteLength(JSON.stringify(doc)) > MAX_BYTES) throw new Error('DATA_DOCUMENT_BUDGET');
}
function summaryBucket(bucket) {
    return { ...Object.fromEntries(FIELDS.map(field => [field, bucket[field]])), uniqueHll: bucket.uniqueHll };
}
function retained(key, now) {
    const [kind, value] = key.split('_');
    if (kind === 'minute') return Number(value) >= Math.floor(now / MINUTE) - 60 && Number(value) <= Math.floor(now / MINUTE);
    if (kind === 'hour') return Number(value) >= Math.floor(now / HOUR) - 24 && Number(value) <= Math.floor(now / HOUR);
    if (kind === 'day') return value >= new Date(Date.parse(`${dateKey(now)}T12:00:00Z`) - 30 * DAY).toISOString().slice(0, 10) && value <= dateKey(now);
    if (kind === 'month') {
        const today = dateKey(now);
        const earliest = `${Number(today.slice(0, 4)) - 1}${today.slice(4, 7)}`;
        return value >= earliest && value <= today.slice(0, 7);
    }
    return kind === 'year';
}
function updateSummaries(recent, history, changes, now) {
    const documents = [recent, history].map(doc => ({ ...doc, buckets: { ...doc.buckets } }));
    for (const [key, bucket] of changes) {
        const target = key.startsWith('minute_') || key.startsWith('hour_') ? documents[0] : documents[1];
        target.buckets[key] = summaryBucket(bucket);
    }
    for (const doc of documents) {
        for (const key of Object.keys(doc.buckets)) if (!retained(key, now)) delete doc.buckets[key];
        for (const [kind, limit] of Object.entries(LIMITS)) {
            if (Object.keys(doc.buckets).filter(key => key.startsWith(`${kind}_`)).length > limit) throw new Error('DATA_BUCKET_BUDGET');
        }
        doc.revision += 1;
        doc.generatedAtMs = now;
        assertSize(doc);
    }
    return documents;
}

async function projectSession(sessionId, db = admin.firestore(), now = Date.now()) {
    if (!/^[a-zA-Z0-9_-]{1,200}$/.test(sessionId)) throw new Error('DATA_SESSION_ID_INVALID');
    return db.runTransaction(async transaction => {
        const control = (await transaction.get(db.doc('analytics_realtime_control/current'))).data();
        if (!control || !['shadow', 'active'].includes(control.mode)) return 'disabled';
        if (control.schemaVersion !== 1 || !/^[a-zA-Z0-9_-]{1,80}$/.test(control.epoch || '')
            || !control.bootstrapComplete || !Number.isSafeInteger(control.mutableSinceMs)) throw new Error('DATA_BOOTSTRAP_REQUIRED');
        const ledgerRef = db.doc(`analytics_realtime_ledgers/${hashOpaque(sessionId)}`);
        const [source, exclusion, ledger] = await Promise.all([
            transaction.get(db.doc(`analytics_sessions/${sessionId}`)),
            transaction.get(db.doc(`analytics_session_exclusions/${sessionId}`)),
            transaction.get(ledgerRef)
        ]);
        const old = ledger.data();
        if (old && old.epoch !== control.epoch) throw new Error('DATA_EPOCH_MISMATCH');
        const excluded = exclusion.data()?.reason === 'admin_identity_resolved' || source.data()?.type === 'admin';
        // A TTL deletion is not a withdrawal of historic traffic. Old event payloads are never used.
        if (!source.exists && !excluded) return 'ttl-or-missing';
        if (old?.tombstone) return 'tombstone';
        const next = excluded ? null : contribution(sessionId, source.data());
        if (next && next.startedAtMs < control.mutableSinceMs) throw new Error('DATA_PRE_BASELINE_SOURCE');
        if (next && next.startedAtMs > now) throw new Error('DATA_FUTURE_SOURCE');
        const digest = hash(next);
        if (old?.digest === digest) return 'noop';
        const previous = old?.contribution || null;
        const sourceVersion = version(excluded && exclusion.exists ? exclusion.updateTime : source.updateTime);
        if (old?.sourceVersion && (sourceVersion.seconds < old.sourceVersion.seconds
            || (sourceVersion.seconds === old.sourceVersion.seconds && sourceVersion.nanoseconds < old.sourceVersion.nanoseconds))) {
            throw new Error('DATA_SOURCE_VERSION_REGRESSION');
        }
        const keys = [...new Set([...(previous?.keys || []), ...(next?.keys || [])])];
        const nextLedger = {
            schemaVersion: 1, epoch: control.epoch, sourceVersion, contribution: next,
            digest, tombstone: excluded, updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        if (!keys.length) { transaction.set(ledgerRef, nextLedger); return 'excluded-before-counting'; }
        const [recent, history, ...bucketSnapshots] = await Promise.all([
            transaction.get(db.doc('admin_analytics_realtime/recent')),
            transaction.get(db.doc('admin_analytics_realtime/history')),
            ...keys.map(key => transaction.get(db.doc(`analytics_realtime_buckets/${key}`)))
        ]);
        if (!recent.exists || !history.exists || recent.data().epoch !== control.epoch || history.data().epoch !== control.epoch
            || recent.data().schemaVersion !== 1 || history.data().schemaVersion !== 1
            || !Number.isSafeInteger(recent.data().revision) || recent.data().revision < 1
            || recent.data().revision >= Number.MAX_SAFE_INTEGER
            || !Number.isSafeInteger(recent.data().generatedAtMs) || !Number.isSafeInteger(history.data().generatedAtMs)
            || recent.data().coverageStartMs !== history.data().coverageStartMs
            || typeof recent.data().historyComplete !== 'boolean'
            || recent.data().historyComplete !== history.data().historyComplete
            || recent.data().revision !== history.data().revision) throw new Error('DATA_BASELINE_INVALID');
        const changes = keys.map((key, index) => [key, changeBucket(bucketSnapshots[index].data(),
            previous?.keys.includes(key) ? previous : null, next?.keys.includes(key) ? next : null)]);
        // A transaction retry must not roll the pruning clock backwards.
        const summaries = updateSummaries(recent.data(), history.data(), changes,
            Math.max(now, recent.data().generatedAtMs, history.data().generatedAtMs));
        for (let i = 0; i < 2; i += 1) transaction.set(db.doc(`admin_analytics_realtime/${i ? 'history' : 'recent'}`), summaries[i]);
        for (const [key, bucket] of changes) transaction.set(db.doc(`analytics_realtime_buckets/${key}`), bucket);
        transaction.set(ledgerRef, nextLedger);
        return excluded ? 'removed' : previous ? 'updated' : 'created';
    });
}

// Offline seed construction: callers must prove source completeness in the cloud gate.
// Immutable days strictly precede mutableSinceMs; all later sessions/facts have ledgers.
function buildSeed({ epoch, mutableSinceMs, coverageStartMs, historyComplete = false, sessions = [], facts = [], exclusions = [], legacyDays = [], now = Date.now() }) {
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(epoch || '') || !Number.isSafeInteger(mutableSinceMs)
        || !Number.isSafeInteger(coverageStartMs) || coverageStartMs > mutableSinceMs || mutableSinceMs > now
        || sessions.length > 20000 || facts.length > 20000 || exclusions.length > 20000
        || legacyDays.length > 18300) throw new Error('DATA_SEED_BOUNDS');
    if (dateKey(mutableSinceMs - 1) === dateKey(mutableSinceMs)) throw new Error('DATA_SEED_MIDNIGHT_REQUIRED');
    const buckets = new Map();
    const ledgers = new Map();
    const records = new Map();
    const excludedIds = new Set(exclusions);
    for (const entry of sessions) {
        if (records.has(entry.id)) throw new Error('DATA_SEED_DUPLICATE');
        records.set(entry.id, entry);
    }
    const seenFacts = new Set();
    for (const entry of facts) {
        if (seenFacts.has(entry.id)) throw new Error('DATA_SEED_DUPLICATE');
        seenFacts.add(entry.id);
        if (records.has(entry.id) || excludedIds.has(entry.id)) continue;
        const c = entry.data?.contribution;
        if (!c || !/^\d{4}-\d{2}-\d{2}$/.test(c.dateKey)) throw new Error('DATA_SEED_FACT');
        if (c.dateKey < dateKey(mutableSinceMs)) continue; // Already in immutable daily baseline.
        // Old facts did not retain minutes. Never invent recent minute/hour traffic.
        const startedAtMs = Date.parse(`${c.dateKey}T12:00:00Z`);
        if (!Number.isFinite(startedAtMs) || dateKey(startedAtMs) !== c.dateKey
            || startedAtMs > now - 2 * DAY || !/^[a-f0-9]{64}$/.test(c.subject)) throw new Error('DATA_RECENT_FACT_REQUIRES_SOURCE');
        const prepared = { startedAtMs, keys: keysFor(startedAtMs), point: point(c.subject) };
        for (const field of FIELDS) {
            if (!Number.isSafeInteger(c[field]) || c[field] < 0) throw new Error('DATA_SEED_FACT');
            prepared[field] = c[field];
        }
        if (prepared.sessions !== 1 || prepared.bounces > 1 || prepared.mobile > 1) throw new Error('DATA_SEED_FACT');
        records.set(entry.id, { id: entry.id, updateTime: entry.updateTime, prepared });
    }
    if (records.size > 20000) throw new Error('DATA_SEED_BOUNDS');
    for (const { id, data, updateTime, prepared } of records.values()) {
        if (!/^[a-zA-Z0-9_-]{1,200}$/.test(id)) throw new Error('DATA_SESSION_ID_INVALID');
        const excluded = excludedIds.has(id) || data?.type === 'admin';
        const next = excluded ? null : prepared || contribution(id, data);
        if (next && (next.startedAtMs < mutableSinceMs || next.startedAtMs > now)) throw new Error('DATA_SEED_OVERLAP');
        const key = hashOpaque(id);
        if (ledgers.has(key)) throw new Error('DATA_SEED_DUPLICATE');
        ledgers.set(key, { schemaVersion: 1, epoch, sourceVersion: version(updateTime), contribution: next, digest: hash(next), tombstone: excluded });
        for (const bucketKey of next?.keys || []) buckets.set(bucketKey, changeBucket(buckets.get(bucketKey), null, next));
    }
    const seenDays = new Set();
    for (const day of legacyDays) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day.dateKey) || day.dateKey >= dateKey(mutableSinceMs) || seenDays.has(day.dateKey)) throw new Error('DATA_SEED_OVERLAP');
        if (typeof day.uniqueHll !== 'string' || Buffer.from(day.uniqueHll, 'base64').length !== SIZE) throw new Error('DATA_SEED_SKETCH');
        seenDays.add(day.dateKey);
        for (const key of [`day_${day.dateKey}`, `month_${day.dateKey.slice(0, 7)}`, `year_${day.dateKey.slice(0, 4)}`]) {
            const bucket = { ...zero(), ...buckets.get(key) };
            for (const field of FIELDS) {
                if (!Number.isSafeInteger(day[field]) || day[field] < 0) throw new Error('DATA_BASELINE_COUNTER');
                bucket[field] += day[field];
            }
            bucket.baselineHll = mergeSketch(bucket.baselineHll, day.uniqueHll);
            bucket.uniqueHll = mergeSketch(bucket.uniqueHll, day.uniqueHll);
            buckets.set(key, bucket);
        }
    }
    const common = { schemaVersion: 1, epoch, revision: 0, coverageStartMs, historyComplete, generatedAtMs: now, buckets: {} };
    const [recent, history] = updateSummaries(common, common, buckets, now);
    return { control: { schemaVersion: 1, epoch, mode: 'paused', bootstrapComplete: false, mutableSinceMs },
        recent, history, buckets: Object.fromEntries(buckets), ledgers: Object.fromEntries(ledgers) };
}

module.exports = { projectSession, buildSeed, contribution, changeBucket, updateSummaries, point, keysFor, mergeSketch, summaryBucket, MAX_BYTES };
