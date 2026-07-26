'use strict';

function dependencyError(name) {
    const error = new Error(`COMMERCE_DEPENDENCY_INVALID:${name}`);
    error.code = 'COMMERCE_DEPENDENCY_INVALID';
    error.dependency = name;
    return error;
}

function requireFunction(value, name) {
    if (typeof value !== 'function') throw dependencyError(name);
    return value;
}

function createCommerceDependencies({ clock, ids, stripe, firestore }) {
    if (!clock || !ids || !stripe || !firestore) throw dependencyError('root');
    return Object.freeze({
        clock: Object.freeze({ now: requireFunction(clock.now, 'clock.now') }),
        ids: Object.freeze({
            orderId: requireFunction(ids.orderId, 'ids.orderId'),
            commandId: requireFunction(ids.commandId, 'ids.commandId')
        }),
        stripe,
        firestore: Object.freeze({
            runTransaction: requireFunction(firestore.runTransaction, 'firestore.runTransaction')
        })
    });
}

module.exports = { createCommerceDependencies };
