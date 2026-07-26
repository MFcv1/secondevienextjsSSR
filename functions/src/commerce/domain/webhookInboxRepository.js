'use strict';

const {
    assertInboxFence,
    claimInbox,
    markInboxFailed,
    markInboxProcessed
} = require('./webhookInbox');

function repositoryError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function snapshotExists(snapshot) {
    return typeof snapshot.exists === 'function' ? snapshot.exists() : snapshot.exists === true;
}

function createWebhookInboxRepository({ db, refs, failpoints = null }) {
    if (
        !db ||
        typeof db.runTransaction !== 'function' ||
        !refs ||
        typeof refs.inbox !== 'function'
    ) {
        throw repositoryError('COMMERCE_INBOX_REPOSITORY_DEPENDENCY_INVALID');
    }

    return Object.freeze({
        async persist(entry) {
            const ref = refs.inbox(entry.inboxId);
            const persisted = await db.runTransaction(async (transaction) => {
                const snapshot = await transaction.get(ref);
                if (snapshotExists(snapshot)) {
                    const existing = snapshot.data();
                    if (existing.payloadHash !== entry.payloadHash) {
                        throw repositoryError('COMMERCE_INBOX_PAYLOAD_CONFLICT');
                    }
                    return existing;
                }
                transaction.set(ref, entry);
                return entry;
            });
            failpoints?.hit('inbox.after_persist');
            return persisted;
        },

        async claim(inboxId, lease) {
            const ref = refs.inbox(inboxId);
            const claimed = await db.runTransaction(async (transaction) => {
                const snapshot = await transaction.get(ref);
                if (!snapshotExists(snapshot)) throw repositoryError('COMMERCE_INBOX_MISSING');
                const next = claimInbox(snapshot.data(), lease);
                transaction.set(ref, next);
                return next;
            });
            failpoints?.hit('inbox.after_claim');
            return claimed;
        },

        async applyProcessed({
            inboxId,
            leaseToken,
            nowMillis,
            processedAt,
            applyDomainEffects
        }) {
            if (typeof applyDomainEffects !== 'function') {
                throw repositoryError('COMMERCE_INBOX_APPLIER_INVALID');
            }
            const ref = refs.inbox(inboxId);
            const result = await db.runTransaction(async (transaction) => {
                const snapshot = await transaction.get(ref);
                if (!snapshotExists(snapshot)) throw repositoryError('COMMERCE_INBOX_MISSING');
                const entry = snapshot.data();
                assertInboxFence(entry, leaseToken, nowMillis);
                failpoints?.hit('inbox.before_apply_commit');
                const domainResult = await applyDomainEffects(transaction, entry);
                transaction.set(ref, markInboxProcessed(entry, {
                    leaseToken,
                    nowMillis,
                    processedAt
                }));
                return domainResult;
            });
            failpoints?.hit('inbox.after_commit');
            return result;
        },

        async fail(inboxId, failure) {
            const ref = refs.inbox(inboxId);
            return db.runTransaction(async (transaction) => {
                const snapshot = await transaction.get(ref);
                if (!snapshotExists(snapshot)) throw repositoryError('COMMERCE_INBOX_MISSING');
                const failed = markInboxFailed(snapshot.data(), failure);
                transaction.set(ref, failed);
                return failed;
            });
        }
    });
}

module.exports = { createWebhookInboxRepository };
