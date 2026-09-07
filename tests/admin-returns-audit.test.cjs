'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const source = fs.readFileSync(require.resolve('../src/kit/admin/AdminReturns.jsx'), 'utf8');

test('returns display cannot replace a zero or unknown refund with the full order amount', () => {
    const format = vm.runInNewContext(`${source.slice(source.indexOf('function formatAmount('), source.indexOf('function getOrderEmail('))}; formatAmount`);
    assert.match(format({ schemaVersion: 2, total: 500, amounts: { refundedCents: 0 }, refundAggregate: { pendingCents: 0 } }), /^0,00/);
    assert.match(format({ schemaVersion: 2, total: 500, amounts: { refundedCents: 1000 }, refundAggregate: { pendingCents: 500 } }), /^15,00/);
    assert.equal(format({ schemaVersion: 2, total: 500 }), 'Montant indisponible');
});

test('return commands prevent concurrent submissions and remain disabled in read-only mode', async () => {
    for (const enabled of [false, true]) {
        let finish, runs = 0;
        const pending = new Promise(resolve => { finish = resolve; });
        const run = vm.runInNewContext(`${source.slice(source.indexOf('    const runAction ='), source.indexOf('    const handleResumeRefund ='))}; runAction`, {
            returnCommandsEnabled: enabled, operationRef: { current: false },
            setOperation() {}, setNotice() {}, refreshFirstPage: async () => {}, console,
        });
        const runner = async () => { runs++; await pending; return 'Applied'; };
        const first = run('order-one', 'refund', runner);
        await run('order-two', 'refund', runner);
        assert.equal(runs, enabled ? 1 : 0);
        finish(); await first;
    }
});
