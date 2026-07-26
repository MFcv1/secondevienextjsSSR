'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
    executeIdempotentCommand,
    hashPayload
} = require('../../../functions/src/commerce/domain/idempotency');
const {
    FAILPOINT_NAMES,
    createFailpointController
} = require('../../../functions/src/commerce/domain/failpoints');

function makeRepository() {
    const records = new Map();
    return {
        records,
        lookupResult: async (commandId) => records.get(commandId) || null,
        persistResult: async (record) => {
            records.set(record.commandId, record);
        }
    };
}

function makeCommand(payload = { type: 'advance' }) {
    return {
        commandId: 'command-id-0001',
        expectedVersion: 0,
        payload
    };
}

test('same commandId and payload returns the stored result before stale-version validation', async () => {
    const repository = makeRepository();
    let transitionCalls = 0;
    const transition = (order) => {
        transitionCalls += 1;
        return { ...order, stateVersion: order.stateVersion + 1 };
    };
    const command = makeCommand();
    const first = await executeIdempotentCommand({
        order: { stateVersion: 0 },
        command,
        ...repository,
        transition
    });
    const retry = await executeIdempotentCommand({
        order: { stateVersion: 99 },
        command,
        ...repository,
        transition
    });
    assert.deepEqual(retry, first);
    assert.equal(transitionCalls, 1);
});

test('same commandId with a different payload is a conflict', async () => {
    const repository = makeRepository();
    repository.records.set('command-id-0001', {
        commandId: 'command-id-0001',
        payloadHash: hashPayload({ type: 'advance' }),
        result: { stateVersion: 1 }
    });
    await assert.rejects(
        executeIdempotentCommand({
            order: { stateVersion: 1 },
            command: makeCommand({ type: 'cancel' }),
            ...repository,
            transition: (order) => order
        }),
        { code: 'COMMERCE_IDEMPOTENCY_PAYLOAD_CONFLICT' }
    );
});

test('idempotency lookup occurs before expectedVersion', async () => {
    const calls = [];
    await assert.rejects(
        executeIdempotentCommand({
            order: { stateVersion: 3 },
            command: makeCommand(),
            lookupResult: async () => {
                calls.push('lookup');
                return null;
            },
            persistResult: async () => calls.push('persist'),
            transition: (order) => order
        }),
        { code: 'COMMERCE_STALE_VERSION' }
    );
    assert.deepEqual(calls, ['lookup']);
});

test('lost response after persist converges on retry without a second transition', async () => {
    const repository = makeRepository();
    let transitionCalls = 0;
    const transition = (order) => {
        transitionCalls += 1;
        return { ...order, stateVersion: order.stateVersion + 1, effect: 'single' };
    };
    await assert.rejects(
        executeIdempotentCommand({
            order: { stateVersion: 0 },
            command: makeCommand(),
            ...repository,
            transition,
            failpoints: createFailpointController({
                'command.after_persist_before_response': 1
            })
        }),
        { code: 'COMMERCE_FAILPOINT_TRIGGERED' }
    );
    assert.equal(repository.records.size, 1);
    const retry = await executeIdempotentCommand({
        order: { stateVersion: 0 },
        command: makeCommand(),
        ...repository,
        transition
    });
    assert.equal(retry.effect, 'single');
    assert.equal(transitionCalls, 1);
});

test('every named failpoint is deterministic and fails closed', () => {
    for (const name of FAILPOINT_NAMES) {
        const controller = createFailpointController({ [name]: 1 });
        assert.throws(() => controller.hit(name), {
            code: 'COMMERCE_FAILPOINT_TRIGGERED',
            failpoint: name
        });
        assert.doesNotThrow(() => controller.hit(name));
    }
    assert.throws(
        () => createFailpointController({ invented: 1 }),
        { code: 'COMMERCE_FAILPOINT_INVALID' }
    );
});
