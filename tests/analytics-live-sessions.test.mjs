import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { isSessionOnline } from '../src/kit/admin/liveSessionPresence.js';
const { projectData } = createRequire(import.meta.url)('../functions/src/analytics/liveSessions');
test('live projection is allowlisted, bounded and contains no raw identity or token', () => {
    const input = { startedAt: 1000, lastActivityAt: 2000, userId: 'private-uid', email: 'private@example.test',
        syncTokenHash: 'secret', ip: '127.0.0.1', os: 'MacOS', device: 'Desktop', sessionActive: true,
        journey: Array.from({ length: 40 }, () => ({ page: 'detail', itemId: 'chair', search: 'private', timestampMs: 2000, duration: 2 })) };
    const output = projectData('synthetic', input);
    assert.equal(output.detail.journey.length, 25);
    assert.equal(output.summary.sessionActive, true);
    for (const privateText of ['private-uid', 'private@example.test', 'secret', '127.0.0.1', 'search']) assert.ok(!JSON.stringify(output).includes(privateText));
    assert.throws(() => projectData('bad', {}), /TIMESTAMP/);
});
test('presence allows 60 second heartbeat and rejects old, closed and invalid sessions', () => {
    assert.equal(isSessionOnline({ lastActivityAt: 100000, sessionActive: true }, 161000), true);
    assert.equal(isSessionOnline({ lastActivityAt: 100000, sessionActive: true }, 251000), false);
    assert.equal(isSessionOnline({ lastActivityAt: 100000, sessionActive: false }, 110000), false);
    assert.equal(isSessionOnline({}, 110000), false);
});
test('live UI reads projected summaries and one detail, not raw sessions or an overview callable', () => {
    const source = readFileSync(new URL('../src/kit/admin/liveSessionsChannel.js', import.meta.url), 'utf8');
    assert.ok(source.includes('limit(10)'));
    assert.ok(source.includes('admin_analytics_session_details'));
    assert.ok(!source.includes("collection(db, 'analytics_sessions')"));
    assert.ok(!source.includes('httpsCallable'));
    assert.ok(source.includes('historical = new Map(snapshot.docs.map'));
    assert.ok(source.includes('epoch !== generation'));
});

test('listener owner shares recent rows, replaces history, propagates removals and rejects late callbacks', () => {
    const listeners = [];
    const source = readFileSync(new URL('../src/kit/admin/liveSessionsChannel.js', import.meta.url), 'utf8')
        .replace(/^import .*;$/gm, '').replaceAll('export ', '') + '\nglobalThis.channel = liveSessionsChannel;';
    const context = { db: {}, collection: (...args) => args, doc: (...args) => args, documentId: () => '__name__',
        limit: n => ({ limit: n }), orderBy: (...args) => args, query: (...args) => args, startAfter: cursor => cursor,
        onSnapshot: (q, ...args) => { const callbacks = args.filter(v => typeof v === 'function'); const listener = { q, next: callbacks[0], error: callbacks[1], stopped: false }; listeners.push(listener); return () => { listener.stopped = true; }; } };
    vm.runInNewContext(source, context);
    const channel = context.channel;
    const snapshot = (start, count) => {
        const docs = Array.from({ length: count }, (_, i) => ({ id: String(start + i), data: () => ({ schemaVersion: 1, id: String(start + i), startedAt: 1, lastActivityAt: 1000 - start - i, sessionActive: true, visitorKey: 'opaque' }) }));
        return { docs, size: count, metadata: { fromCache: false } };
    };
    channel.setOwner('admin'); channel.start(); channel.start();
    assert.equal(listeners.length, 1);
    listeners[0].next(snapshot(0, 10));
    assert.equal(channel.getSnapshot().sessions.length, 10);
    channel.older(); listeners[1].next(snapshot(10, 10));
    assert.equal(channel.getSnapshot().sessions.length, 20);
    channel.older(); assert.equal(listeners[1].stopped, true);
    listeners[2].next(snapshot(20, 10));
    listeners[1].next(snapshot(100, 10)); // late callback from closed page
    assert.equal(channel.getSnapshot().sessions.some(v => v.id === '100'), false);
    listeners[0].next(snapshot(0, 0));
    assert.equal(channel.getSnapshot().sessions.length, 10);
    channel.clear(); listeners[2].next(snapshot(20, 10));
    assert.equal(channel.getSnapshot().sessions.length, 0);
    assert.ok(listeners.every(v => v.stopped));
});
