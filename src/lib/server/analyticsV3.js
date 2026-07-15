import 'server-only';

import crypto from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminAppCheck, getAdminDb } from './firebaseAdmin';
import {
  ANALYTICS_SCHEMA_VERSION,
  CLIENT_ACTIONS,
  MEASUREMENT_MODES,
  PAGE_EVENTS,
} from '../analytics/v3Contract';

const MAX_BODY_BYTES = 32 * 1024;
const MAX_EVENTS = 25;
const MAX_CONTEXT_KEYS = 8;
const SESSION_MAX_MS = 24 * 60 * 60 * 1000;
const LATE_WINDOW_MS = 24 * 60 * 60 * 1000;
const CONSENTED_RETENTION_DAYS = 90;
const AUDIENCE_RETENTION_DAYS = 3;
const TOKEN_COOKIE_PREFIX = 'sv_a_';
const ID_PATTERN = /^[A-Za-z0-9_-]{16,160}$/;

const requiredSecret = (name) => {
  const value = process.env[name];
  if (!value || value.length < 32) throw new Error(`analytics_secret_missing:${name}`);
  return value;
};

const hmac = (secret, value) => crypto.createHmac('sha256', secret).update(value).digest('base64url');
const digest = (value) => crypto.createHash('sha256').update(value).digest('base64url');
const safeEqual = (left, right) => {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const expiry = (days) => Timestamp.fromMillis(Date.now() + days * 86400000);

export function assertSameOrigin(request) {
  const origin = request.headers.get('origin');
  const site = request.headers.get('sec-fetch-site');
  const allowedOrigins = new Set([new URL(request.url).origin]);
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    try { allowedOrigins.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).origin); } catch { /* configuration invalide: ne pas elargir */ }
  }
  if (origin && !allowedOrigins.has(new URL(origin).origin)) throw new Error('analytics_origin_rejected');
  if (site && !['same-origin', 'same-site', 'none'].includes(site)) throw new Error('analytics_fetch_site_rejected');
}

export function assertAnalyticsV3Enabled() {
  if (process.env.ANALYTICS_V3_ENABLED !== 'true') throw new Error('analytics_v3_disabled');
}

export async function readBoundedJson(request) {
  const raw = await request.text();
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) throw new Error('analytics_payload_too_large');
  try { return JSON.parse(raw || '{}'); } catch { throw new Error('analytics_json_invalid'); }
}

export function tokenCookieName(tabSessionId) {
  return `${TOKEN_COOKIE_PREFIX}${digest(tabSessionId).slice(0, 18)}`;
}

export function analyticsErrorResponse(error) {
  const code = String(error?.message || error);
  const isConfig = code.startsWith('analytics_secret_missing') || code === 'analytics_db_unavailable' || code === 'analytics_v3_disabled';
  const status = isConfig ? 503 : (code.includes('token') ? 401 : 400);
  return Response.json({ ok: false, code: code.split(':')[0] }, { status });
}

export async function observeAnalyticsAppCheck(request) {
  const token = request.headers.get('x-firebase-appcheck');
  if (!token) return false;
  try {
    const appCheck = getAdminAppCheck();
    if (!appCheck) return false;
    await appCheck.verifyToken(token);
    return true;
  } catch {
    return false;
  }
}

function assertId(value, label) {
  if (!ID_PATTERN.test(String(value || ''))) throw new Error(`analytics_${label}_invalid`);
  return String(value);
}

function normalizeMode(value, consentVersion) {
  if (value === MEASUREMENT_MODES.CONSENTED && typeof consentVersion === 'string' && consentVersion.length <= 40) {
    return { measurementMode: value, consentVersion };
  }
  return { measurementMode: MEASUREMENT_MODES.AUDIENCE, consentVersion: null };
}

function sanitizeContext(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const allow = new Set(['entityId', 'categoryId', 'productId', 'sourceClass', 'form', 'quantity', 'currency', 'deviceClass', 'osFamily', 'browserFamily']);
  const result = {};
  for (const [key, value] of Object.entries(input).slice(0, MAX_CONTEXT_KEYS)) {
    if (!allow.has(key)) continue;
    if (typeof value === 'string') result[key] = value.slice(0, 160);
    else if (typeof value === 'number' && Number.isFinite(value)) result[key] = value;
  }
  return result;
}

function normalizeEvent(event, expected) {
  const eventId = assertId(event?.eventId, 'event_id');
  const tabSessionId = assertId(event?.tabSessionId, 'tab_session_id');
  if (tabSessionId !== expected.tabSessionId) throw new Error('analytics_tab_mismatch');
  const seq = Number(event?.seq);
  if (!Number.isInteger(seq) || seq < 1 || seq > 10000) throw new Error('analytics_seq_invalid');
  const eventName = String(event?.eventName || '');
  if (!PAGE_EVENTS.has(eventName) && !CLIENT_ACTIONS.has(eventName)) throw new Error('analytics_event_rejected');
  if (eventName.endsWith('_server')) throw new Error('analytics_server_event_rejected');
  const occurredAt = Number(event?.occurredAt);
  const now = Date.now();
  return {
    schemaVersion: ANALYTICS_SCHEMA_VERSION,
    eventId,
    batchId: expected.batchId,
    tabSessionId,
    seq,
    eventName,
    routeKey: String(event?.routeKey || 'unknown').slice(0, 80),
    occurredAt: Number.isFinite(occurredAt) ? Math.min(now + 60000, Math.max(now - LATE_WINDOW_MS, occurredAt)) : now,
    activeDeltaMs: Math.min(30 * 60 * 1000, Math.max(0, Number(event?.activeDeltaMs) || 0)),
    context: sanitizeContext(event?.context),
    measurementMode: expected.measurementMode,
    consentVersion: expected.consentVersion,
    synthetic: event?.synthetic === true,
    testRunId: event?.synthetic === true && ID_PATTERN.test(String(event?.testRunId || '')) ? String(event.testRunId) : null,
  };
}

function getDb() {
  const db = getAdminDb();
  if (!db) throw new Error('analytics_db_unavailable');
  return db;
}

export async function createAnalyticsSession(payload, { appCheckObserved = false } = {}) {
  const tabSessionId = assertId(payload?.tabSessionId, 'tab_session_id');
  const { measurementMode, consentVersion } = normalizeMode(payload?.measurementMode, payload?.consentVersion);
  const sessionId = crypto.randomUUID().replaceAll('-', '');
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenKeyId = process.env.ANALYTICS_SESSION_HMAC_KEY_ID || 'session-v1';
  const tokenHash = hmac(requiredSecret('ANALYTICS_SESSION_HMAC_KEY'), `${sessionId}|${token}`);
  const subjectValue = typeof payload?.subjectIud === 'string' && ID_PATTERN.test(payload.subjectIud) ? payload.subjectIud : sessionId;
  const subjectKeyName = measurementMode === MEASUREMENT_MODES.CONSENTED ? 'ANALYTICS_BROWSER_HMAC_KEY' : 'ANALYTICS_AUDIENCE_HMAC_KEY';
  const subjectKeyId = process.env[`${subjectKeyName}_ID`] || (measurementMode === MEASUREMENT_MODES.CONSENTED ? 'browser-v1' : 'audience-v1');
  const subjectId = hmac(requiredSecret(subjectKeyName), `secondevie|${subjectValue}`);
  const now = Timestamp.now();
  const retention = measurementMode === MEASUREMENT_MODES.CONSENTED ? CONSENTED_RETENTION_DAYS : AUDIENCE_RETENTION_DAYS;
  const device = sanitizeContext(payload?.device);

  await getDb().collection('analytics_sessions_v3').doc(sessionId).create({
    schemaVersion: ANALYTICS_SCHEMA_VERSION,
    tabSessionId,
    measurementMode,
    consentVersion,
    browserSubjectId: measurementMode === MEASUREMENT_MODES.CONSENTED ? subjectId : null,
    audienceSubjectId: measurementMode === MEASUREMENT_MODES.AUDIENCE ? subjectId : null,
    authSubjectId: null,
    networkDayId: null,
    identitySource: payload?.subjectIud ? (measurementMode === MEASUREMENT_MODES.CONSENTED ? 'product_iud' : 'audience_iud') : 'fallback_session',
    geo: { country: 'Unknown', region: 'Unknown', city: 'Unknown', accuracy: 'unavailable' },
    device: {
      class: device.deviceClass || 'Unknown',
      osFamily: device.osFamily || 'Unknown',
      browserFamily: device.browserFamily || 'Unknown',
    },
    acquisition: { referrerHost: null, sourceClass: 'direct_or_unknown' },
    firstReceivedAt: now,
    lastReceivedAt: now,
    activeDurationMs: 0,
    pageViewCount: 0,
    eventCount: 0,
    eventVersion: 0,
    aggregatedVersion: 0,
    status: 'open',
    outcome: null,
    dataQuality: { acknowledgedBatches: 0, duplicateBatches: 0, sequenceGaps: 0, schemaValid: true, appCheckObserved },
    synthetic: payload?.synthetic === true,
    testRunId: payload?.synthetic === true && ID_PATTERN.test(String(payload?.testRunId || '')) ? payload.testRunId : null,
    keyIds: { session: tokenKeyId, subject: subjectKeyId },
    sessionTokenHash: tokenHash,
    acceptedSeqHashes: {},
    expireAt: expiry(retention),
  });

  return { sessionId, token, tabSessionId, measurementMode, consentVersion };
}

export async function appendAnalyticsBatch(payload, token, { appCheckObserved = false } = {}) {
  const sessionId = assertId(payload?.sessionId, 'session_id');
  const tabSessionId = assertId(payload?.tabSessionId, 'tab_session_id');
  const batchId = assertId(payload?.batchId, 'batch_id');
  const events = Array.isArray(payload?.events) ? payload.events : [];
  if (events.length < 1 || events.length > MAX_EVENTS) throw new Error('analytics_event_count_invalid');
  if (!token) throw new Error('analytics_token_missing');

  const db = getDb();
  const rootRef = db.collection('analytics_sessions_v3').doc(sessionId);
  const chunkRef = rootRef.collection('chunks').doc(batchId);

  return db.runTransaction(async (tx) => {
    const [rootSnap, chunkSnap] = await Promise.all([tx.get(rootRef), tx.get(chunkRef)]);
    if (!rootSnap.exists) throw new Error('analytics_session_missing');
    const root = rootSnap.data();
    const expectedHash = hmac(requiredSecret('ANALYTICS_SESSION_HMAC_KEY'), `${sessionId}|${token}`);
    if (!safeEqual(expectedHash, root.sessionTokenHash)) throw new Error('analytics_token_invalid');
    if (root.tabSessionId !== tabSessionId) throw new Error('analytics_tab_mismatch');
    if (chunkSnap.exists) {
      tx.update(rootRef, { 'dataQuality.duplicateBatches': FieldValue.increment(1) });
      return { duplicate: true, lastSeqAccepted: chunkSnap.data().lastSeq };
    }
    const firstAt = root.firstReceivedAt?.toMillis?.() || Date.now();
    if (Date.now() - firstAt > SESSION_MAX_MS + LATE_WINDOW_MS) throw new Error('analytics_session_expired');

    const normalized = events.map((event) => normalizeEvent(event, {
      batchId, tabSessionId, measurementMode: root.measurementMode, consentVersion: root.consentVersion,
    })).sort((a, b) => a.seq - b.seq);
    const accepted = { ...(root.acceptedSeqHashes || {}) };
    for (const event of normalized) {
      const eventForHash = { ...event };
      delete eventForHash.batchId;
      const eventHash = digest(JSON.stringify(eventForHash));
      if (accepted[event.seq] && accepted[event.seq] !== eventHash) throw new Error('analytics_seq_collision');
      accepted[event.seq] = eventHash;
    }
    if (Object.keys(accepted).length > 512) throw new Error('analytics_session_event_limit');
    const sequences = Object.keys(accepted).map(Number).sort((a, b) => a - b);
    const gapCount = sequences.reduce((count, seq, index) => count + (index > 0 && seq !== sequences[index - 1] + 1 ? 1 : 0), 0);
    const receivedAt = Timestamp.now();
    const retention = root.measurementMode === MEASUREMENT_MODES.CONSENTED ? CONSENTED_RETENTION_DAYS : AUDIENCE_RETENTION_DAYS;
    const activeDeltaMs = normalized.reduce((sum, event) => sum + event.activeDeltaMs, 0);
    const pageViews = normalized.filter((event) => PAGE_EVENTS.has(event.eventName)).length;
    const lastSeq = normalized.at(-1).seq;

    tx.create(chunkRef, {
      schemaVersion: ANALYTICS_SCHEMA_VERSION,
      tabSessionId,
      firstSeq: normalized[0].seq,
      lastSeq,
      events: normalized,
      activeDeltaMs,
      receivedAt,
      expireAt: expiry(retention),
    });
    tx.update(rootRef, {
      lastReceivedAt: receivedAt,
      activeDurationMs: FieldValue.increment(activeDeltaMs),
      pageViewCount: FieldValue.increment(pageViews),
      eventCount: FieldValue.increment(normalized.length),
      eventVersion: FieldValue.increment(1),
      status: root.aggregatedVersion > 0 ? 'dirty' : 'open',
      acceptedSeqHashes: accepted,
      'dataQuality.acknowledgedBatches': FieldValue.increment(1),
      'dataQuality.sequenceGaps': gapCount,
      'dataQuality.appCheckObserved': root.dataQuality?.appCheckObserved === true || appCheckObserved,
    });
    return { duplicate: false, lastSeqAccepted: lastSeq, gapCount };
  });
}

export async function closeAnalyticsSession(payload, token) {
  const sessionId = assertId(payload?.sessionId, 'session_id');
  const tabSessionId = assertId(payload?.tabSessionId, 'tab_session_id');
  const ref = getDb().collection('analytics_sessions_v3').doc(sessionId);
  const snap = await ref.get();
  if (!snap.exists || snap.data().tabSessionId !== tabSessionId) throw new Error('analytics_session_missing');
  const expectedHash = hmac(requiredSecret('ANALYTICS_SESSION_HMAC_KEY'), `${sessionId}|${token || ''}`);
  if (!safeEqual(expectedHash, snap.data().sessionTokenHash)) throw new Error('analytics_token_invalid');
  await ref.update({ closeHintAt: FieldValue.serverTimestamp(), status: snap.data().aggregatedVersion > 0 ? 'dirty' : 'provisional' });
  return { closed: true };
}

export async function requestAnalyticsWithdrawal(payload) {
  const subjectIud = assertId(payload?.subjectIud, 'subject_iud');
  const browserSubjectId = hmac(requiredSecret('ANALYTICS_BROWSER_HMAC_KEY'), `secondevie|${subjectIud}`);
  const requestId = crypto.randomUUID().replaceAll('-', '');
  await getDb().collection('analytics_privacy_requests_v3').doc(requestId).create({
    schemaVersion: ANALYTICS_SCHEMA_VERSION,
    type: 'withdraw_product_analytics',
    browserSubjectId,
    keyId: process.env.ANALYTICS_BROWSER_HMAC_KEY_ID || 'browser-v1',
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
    expireAt: expiry(90),
  });
  return { requestId, status: 'pending' };
}
