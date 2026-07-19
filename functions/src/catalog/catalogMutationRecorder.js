const crypto = require('crypto');
const admin = require('firebase-admin');
const { classifyCatalogMutation } = require('./mutationClassifier');
const {
    CONTROL_DOCUMENT,
    computeQuietUntil,
    initialPublicationState,
    nextStateVersion
} = require('./publicationState');
const { catalogLog } = require('./structuredLog');

function hashEventId(eventId) {
    return crypto.createHash('sha256').update(String(eventId || '')).digest('hex');
}

function taskIdForRevision(revision, quietUntil) {
    return `catalog-build-r${revision}-q${quietUntil.getTime()}`;
}

async function recordCatalogMutation(dependencies, input) {
    const { db, now = () => new Date(), enqueue, logger = catalogLog } = dependencies;
    if (typeof enqueue !== 'function') throw new TypeError('Catalog mutation enqueue dependency is required');
    const { eventId, appId, productId, before, after } = input;
    if (appId !== 'secondevie') return { result: 'ignored_app' };
    const classification = classifyCatalogMutation({ productId, before, after });
    if (!classification.publicImpact && !classification.inventoryImpact) return { result: 'ignored_no_impact', classification };

    const eventHash = hashEventId(eventId);
    const ledgerRef = db.doc(`sys_catalog_publication_events/${eventHash}`);
    const controlRef = db.doc(CONTROL_DOCUMENT);
    const transactionResult = await db.runTransaction(async (transaction) => {
        const [ledgerSnap, controlSnap] = await Promise.all([
            transaction.get(ledgerRef),
            transaction.get(controlRef)
        ]);
        if (ledgerSnap.exists) {
            const ledger = ledgerSnap.data();
            return {
                duplicate: true,
                revision: Number(ledger.assignedRevision),
                quietUntil: ledger.queuedFor?.toDate?.() || new Date(ledger.queuedFor),
                taskId: ledger.taskName,
                ledger
            };
        }

        const timestamp = now();
        const state = controlSnap.exists ? controlSnap.data() : initialPublicationState(timestamp);
        const revision = Number(state.desiredRevision || 0) + 1;
        const dirtySince = state.dirtySince || timestamp;
        const quietUntil = computeQuietUntil({
            dirtySince,
            nowMs: timestamp.getTime(),
            publicFields: classification.changedPublicFields
        });
        const taskId = taskIdForRevision(revision, quietUntil);
        const ledger = {
            schemaVersion: 1,
            eventHash,
            appId,
            collection: 'furniture',
            productId,
            ...classification,
            assignedRevision: revision,
            dispatchState: 'pending',
            taskName: taskId,
            queuedFor: quietUntil,
            createdAt: timestamp,
            processedAt: null,
            expireAt: new Date(timestamp.getTime() + (7 * 24 * 60 * 60 * 1000))
        };
        transaction.set(ledgerRef, ledger);
        transaction.set(controlRef, {
            ...(!controlSnap.exists ? initialPublicationState(timestamp) : {}),
            stateVersion: nextStateVersion(state),
            dirty: true,
            desiredRevision: revision,
            dirtySince,
            quietUntil,
            queuedTaskName: taskId,
            queuedFor: quietUntil,
            buildState: 'queued',
            lastMutationAt: timestamp,
            updatedAt: timestamp
        }, { merge: true });
        return { duplicate: false, revision, quietUntil, taskId, ledger };
    });

    const enqueueResult = await enqueue({
        revision: transactionResult.revision,
        quietUntil: transactionResult.quietUntil,
        taskId: transactionResult.taskId
    });
    await ledgerRef.set({
        dispatchState: 'scheduled',
        taskName: transactionResult.taskId,
        scheduledAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    logger('info', {
        phase: 'trigger', eventHash, targetRevision: transactionResult.revision,
        taskName: transactionResult.taskId,
        result: transactionResult.duplicate ? 'duplicate' : (enqueueResult.alreadyExists ? 'already_exists' : 'scheduled')
    });
    return {
        result: transactionResult.duplicate ? 'duplicate' : 'scheduled',
        revision: transactionResult.revision,
        eventHash,
        classification,
        enqueueResult
    };
}

module.exports = { hashEventId, recordCatalogMutation, taskIdForRevision };
