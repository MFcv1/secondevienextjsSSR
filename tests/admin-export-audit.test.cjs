'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

function statsHandler({ cached, result, authorized = true } = {}) {
    const calls = [];
    class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }
    const source = fs.readFileSync(require.resolve('../functions/src/auth/adminManagement.js'), 'utf8');
    const handler = vm.runInNewContext(`${source.slice(source.indexOf('const getUserStatsHandler ='), source.indexOf('exports.getUserStats ='))}; getUserStatsHandler`, {
        checkActiveStrongAdmin: async () => { if (!authorized) throw new HttpsError('permission-denied', 'denied'); },
        db: { doc: () => ({ get: async () => ({ exists: Boolean(cached), data: () => cached }) }) },
        admin: { auth: () => ({ listUsers: async (...args) => { calls.push(args); return result; } }) },
        functions: { https: { HttpsError } }, console,
    });
    return { handler, calls };
}

test('customer export reads one bounded Auth page without user metadata and enforces authorization on every call', async () => {
    const result = { users: [{ uid: 'anonymous' }, { uid: 'client', email: 'client@example.test', metadata: {} }], pageToken: 'page-2' };
    const { handler, calls } = statsHandler({ result });
    const page = await handler({ includeUsers: true, pageToken: 'page-1' }, {});
    assert.deepEqual(calls, [[500, 'page-1']]);
    assert.equal(page.users.length, 1);
    assert.equal(page.nextPageToken, 'page-2');
    assert.equal(Object.hasOwn(page.users[0], 'ip'), false);
    await assert.rejects(handler({ includeUsers: true, pageToken: {} }, {}), { code: 'invalid-argument' });
    const denied = statsHandler({ authorized: false, result });
    await assert.rejects(denied.handler({ includeUsers: true }, {}), { code: 'permission-denied' });
    assert.equal(denied.calls.length, 0);
});

test('missing user counter stays unavailable without enumerating all Auth accounts', async () => {
    const { handler, calls } = statsHandler();
    await assert.rejects(handler({}, {}), { code: 'unavailable' });
    assert.equal(calls.length, 0);
    assert.equal((await statsHandler({ cached: { registeredUsers: 42 } }).handler({}, {})).count, 42);
});

test('export follows empty pages, deduplicates users, and rejects cursor loops, overflow and a changed session', async () => {
    const { collectAdminUsers } = await import('../src/kit/admin/adminUserExport.js');
    let call = 0;
    const rows = await collectAdminUsers(async () => ({ data: [
        { users: [], nextPageToken: '2' },
        { users: [{ uid: 'one' }], nextPageToken: '3' },
        { users: [{ uid: 'one' }, { uid: 'two' }] },
    ][call++] }));
    assert.equal(rows.length, 2);
    await assert.rejects(collectAdminUsers(async () => ({ data: { users: [], nextPageToken: 'loop' } })), /incohérente/);
    call = 0;
    await assert.rejects(collectAdminUsers(async () => ({ data: { users: [], nextPageToken: String(++call) } })), /trop volumineux/);
    assert.equal(call, 20);
    let current = true;
    await assert.rejects(collectAdminUsers(async () => { current = false; return { data: { users: [{ uid: 'old-user' }] } }; }, () => current), /session modifiée/);
});

test('hourly sales count captured EUR at payment time, never unpaid order totals', async () => {
    const { getConfirmedCapture } = await import('../src/kit/admin/adminDashboardProjection.js');
    const order = { currency: 'EUR', createdAt: '2020-01-01', total: 999, payment: { status: 'succeeded', succeededAt: '2026-09-07T10:00:00.000Z' }, amounts: { capturedCents: 1000, refundedCents: 500 } };
    assert.deepEqual(getConfirmedCapture(order), { timestamp: Date.parse(order.payment.succeededAt), amount: 10 });
    for (const status of ['processing', 'requires_payment_method', 'canceled']) assert.equal(getConfirmedCapture({ ...order, payment: { ...order.payment, status } }), null);
    assert.equal(getConfirmedCapture({ ...order, currency: 'USD' }), null);
    assert.equal(getConfirmedCapture({ ...order, amounts: {} }), null);
});
