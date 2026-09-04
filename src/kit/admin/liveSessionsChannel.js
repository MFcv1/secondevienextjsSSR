import { useSyncExternalStore } from 'react';
import { collection, doc, documentId, limit, onSnapshot, orderBy, query, startAfter } from 'firebase/firestore';
import { db } from '../config/firebase';

const empty = Object.freeze({ status: 'idle', sessions: [], more: false, loadingMore: false, historyPage: 0 });
let state = empty, owner = null, stop = null, historyStop = null, generation = 0, pageGeneration = 0;
let recent = new Map(), historical = new Map(), recentCursor = null, historyCursor = null;
let pageCursors = [];
const subscribers = new Set();
function emit(patch = {}) {
    const merged = new Map([...historical, ...recent]);
    state = { ...state, sessions: [...merged.values()].sort((a, b) => b.lastActivityAt - a.lastActivityAt || b.id.localeCompare(a.id)), ...patch };
    if (state.status === 'error') state.sessions = [];
    subscribers.forEach(fn => fn());
}
function valid(document) {
    const value = document.data();
    if (value.schemaVersion !== 1 || value.id !== document.id || !Number.isFinite(value.startedAt)
        || !Number.isFinite(value.lastActivityAt) || typeof value.sessionActive !== 'boolean'
        || typeof value.visitorKey !== 'string') throw new Error('SESSION_SCHEMA');
    return value;
}
function clear() {
    generation++; pageGeneration++; stop?.(); stop = null; historyStop?.(); historyStop = null;
    recent = new Map(); historical = new Map(); recentCursor = null; historyCursor = null; pageCursors = []; state = empty;
    subscribers.forEach(fn => fn());
}
const sessionsQuery = cursor => query(collection(db, 'admin_analytics_sessions'),
    orderBy('lastActivityAt', 'desc'), orderBy(documentId(), 'desc'), ...(cursor ? [startAfter(cursor)] : []), limit(10));

// Only the displayed historical page stays subscribed. Replacing the page drops
// its data and listener; no accumulating history cache, no extra getDocs call.
function openHistory(page) {
    historyStop?.(); historyStop = null;
    const epoch = generation, pageEpoch = ++pageGeneration;
    historical = new Map(); historyCursor = null;
    emit({ historyPage: page, loadingMore: page > 0, more: page ? false : recent.size === 10 });
    if (!page) return;
    historyStop = onSnapshot(sessionsQuery(pageCursors[page - 1]), snapshot => {
        if (epoch !== generation || pageEpoch !== pageGeneration) return;
        try {
            historical = new Map(snapshot.docs.map(document => [document.id, valid(document)]));
            historyCursor = snapshot.docs.at(-1) || null;
            emit({ loadingMore: false, more: snapshot.size === 10 });
        } catch { emit({ loadingMore: false, status: 'error', sessions: [] }); }
    }, () => { if (epoch === generation && pageEpoch === pageGeneration) emit({ loadingMore: false, status: 'error', sessions: [] }); });
}
export const liveSessionsChannel = {
    subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); },
    getSnapshot: () => state,
    getServerSnapshot: () => empty,
    setOwner(next) { if (next !== owner) { clear(); owner = next; } },
    clear() { owner = null; clear(); },
    start() {
        if (!owner || stop) return;
        const epoch = generation;
        emit({ status: 'loading' });
        stop = onSnapshot(sessionsQuery(), { includeMetadataChanges: true }, snapshot => {
            if (epoch !== generation) return;
            try {
                recent = new Map(snapshot.docs.map(document => [document.id, valid(document)]));
                recentCursor = snapshot.docs.at(-1) || null;
                emit({ status: state.status === 'error' ? 'error' : snapshot.metadata.fromCache ? 'cached' : 'ready',
                    ...(!state.historyPage ? { more: snapshot.size === 10 } : {}) });
            } catch { emit({ status: 'error', sessions: [] }); }
        }, () => { if (epoch === generation) emit({ status: 'error', sessions: [] }); });
    },
    older() {
        if (!owner || !state.more || state.loadingMore || state.status === 'error') return;
        const cursor = state.historyPage ? historyCursor : recentCursor;
        if (!cursor) return;
        pageCursors = pageCursors.slice(0, state.historyPage);
        pageCursors.push(cursor);
        openHistory(state.historyPage + 1);
    },
    newer() { if (owner && state.historyPage && !state.loadingMore) openHistory(state.historyPage - 1); }
};
export function useLiveSessions() {
    return useSyncExternalStore(liveSessionsChannel.subscribe, liveSessionsChannel.getSnapshot, liveSessionsChannel.getServerSnapshot);
}
export function listenSessionDetail(id, next, error) {
    return onSnapshot(doc(db, 'admin_analytics_session_details', id), snapshot => {
        if (!snapshot.exists()) { next(null); return; }
        const value = snapshot.data();
        if (value.schemaVersion !== 1 || value.id !== id || !Array.isArray(value.journey) || value.journey.length > 25) { error(); return; }
        next(value);
    }, error);
}
