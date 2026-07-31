'use strict';

const { assertActionAllowed, computeAllowedActions } = require('./allowedActions');
const {
    executeIdempotentCommand,
    hashPayload,
    validateCommand
} = require('./idempotency');
const {
    buildOutboxIntent,
    deterministicEffectId
} = require('./commerceEffects');
const { reduceOrder, validateOrderV2 } = require('./orderState');

function repositoryError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function snapshotExists(snapshot) {
    return typeof snapshot.exists === 'function' ? snapshot.exists() : snapshot.exists === true;
}

function eventForAction(action, payload) {
    switch (action) {
        case 'fulfillment_prepare':
            return { type: 'fulfillment_preparing' };
        case 'fulfillment_ready':
            return { type: 'fulfillment_ready_for_pickup' };
        case 'fulfillment_pickup':
            return { type: 'fulfillment_picked_up' };
        case 'fulfillment_ship':
            return {
                type: 'fulfillment_shipped',
                carrierCode: payload.carrierCode || null,
                carrierName: payload.carrierName || null,
                trackingNumber: payload.trackingNumber || null
            };
        case 'fulfillment_update_tracking':
            return {
                type: 'fulfillment_tracking_updated',
                carrierCode: payload.carrierCode || null,
                carrierName: payload.carrierName || null,
                trackingNumber: payload.trackingNumber || null
            };
        case 'fulfillment_deliver':
            return { type: 'fulfillment_delivered' };
        default:
            throw repositoryError('COMMERCE_COMMAND_ACTION_UNSUPPORTED');
    }
}

function emailTemplateForAction(action) {
    switch (action) {
        case 'fulfillment_prepare':
            return 'order-preparing';
        case 'fulfillment_ready':
            return 'order-ready-for-pickup';
        case 'fulfillment_pickup':
            return 'order-picked-up';
        case 'fulfillment_ship':
            return 'order-shipped';
        case 'fulfillment_update_tracking':
            return 'order-tracking-updated';
        case 'fulfillment_deliver':
            return 'order-delivered';
        default:
            return null;
    }
}

function validateActor(actor) {
    if (
        !actor ||
        typeof actor.uid !== 'string' ||
        actor.uid.length < 3 ||
        !['customer', 'admin', 'system'].includes(actor.role) ||
        typeof actor.aal2 !== 'boolean'
    ) {
        throw repositoryError('COMMERCE_ACTOR_INVALID');
    }
}

function createOrderCommandRepository({ db, refs, clock, failpoints = null }) {
    if (
        typeof db?.runTransaction !== 'function' ||
        typeof refs?.order !== 'function' ||
        typeof refs?.commandResult !== 'function' ||
        typeof refs?.auditEvent !== 'function' ||
        typeof refs?.outbox !== 'function' ||
        typeof clock?.now !== 'function'
    ) {
        throw repositoryError('COMMERCE_COMMAND_REPOSITORY_DEPENDENCY_INVALID');
    }

    async function execute({
        orderId,
        action,
        command,
        actor,
        reason,
        payload = {}
    }) {
        validateActor(actor);
        validateCommand(command);
        if (typeof reason !== 'string' || reason.length < 3 || reason.length > 500) {
            throw repositoryError('COMMERCE_COMMAND_REASON_INVALID');
        }
        const commandRef = refs.commandResult(command.commandId);
        const orderRef = refs.order(orderId);
        const auditRef = refs.auditEvent(orderId, command.commandId);
        const emailTemplate = emailTemplateForAction(action);
        const emailEffectId = emailTemplate
            ? deterministicEffectId(['order-command', orderId, action, command.commandId])
            : null;
        const outboxId = emailTemplate
            ? deterministicEffectId([emailEffectId, emailTemplate, 'customer', 'email'])
            : null;
        const outboxRef = outboxId ? refs.outbox(outboxId) : null;
        const commandPayload = {
            action,
            orderId,
            payload,
            actorUid: actor.uid,
            reason
        };
        return db.runTransaction(async (transaction) => {
            const snapshots = await Promise.all([
                transaction.get(commandRef),
                transaction.get(orderRef),
                transaction.get(auditRef),
                ...(outboxRef ? [transaction.get(outboxRef)] : [])
            ]);
            const [commandSnap, orderSnap, auditSnap, outboxSnap] = snapshots;
            const existing = snapshotExists(commandSnap) ? commandSnap.data() : null;
            if (existing && existing.actorUid !== actor.uid) {
                throw repositoryError('COMMERCE_COMMAND_RESULT_ACCESS_DENIED');
            }
            if (!snapshotExists(orderSnap)) throw repositoryError('COMMERCE_ORDER_NOT_FOUND');
            const order = orderSnap.data();
            validateOrderV2(order);

            return executeIdempotentCommand({
                order,
                command: {
                    ...command,
                    payload: commandPayload
                },
                lookupResult: async () => existing,
                transition: (current) => {
                    assertActionAllowed(current, actor, action);
                    let nextOrder;
                    if (action === 'archive_order') {
                        nextOrder = {
                            ...current,
                            stateVersion: current.stateVersion + 1,
                            archivedAt: clock.now(),
                            archivedBy: actor.uid,
                            archiveReason: reason,
                            updatedAt: clock.now()
                        };
                        validateOrderV2(nextOrder);
                    } else {
                        nextOrder = reduceOrder(
                            current,
                            eventForAction(action, payload),
                            { clock }
                        );
                    }
                    return {
                        order: nextOrder,
                        response: {
                            orderId,
                            commandId: command.commandId,
                            action,
                            stateVersion: nextOrder.stateVersion,
                            allowedActions: computeAllowedActions(nextOrder, actor)
                        }
                    };
                },
                persistResult: async (record) => {
                    if (snapshotExists(auditSnap)) {
                        throw repositoryError('COMMERCE_AUDIT_APPEND_ONLY_CONFLICT');
                    }
                    const result = record.result;
                    const outbox = emailTemplate
                        ? buildOutboxIntent({
                            effectId: emailEffectId,
                            aggregateType: 'order',
                            aggregateId: orderId,
                            effectType: action,
                            template: emailTemplate,
                            recipientRole: 'customer',
                            recipientHash: hashPayload({
                                email: order.customerSnapshot?.email || null,
                                ownerUid: order.userId
                            }),
                            payloadSnapshot: {
                                orderId,
                                amountCents: order.amounts.totalCents,
                                currency: order.currency,
                                carrierCode: payload.carrierCode || null,
                                carrierName: payload.carrierName || null,
                                trackingNumber: payload.trackingNumber || null
                            },
                            clock
                        })
                        : null;
                    transaction.set(orderRef, result.order);
                    transaction.set(commandRef, {
                        schemaVersion: 2,
                        commandId: command.commandId,
                        orderId,
                        action,
                        actorUid: actor.uid,
                        payloadHash: record.payloadHash,
                        result: result.response,
                        createdAt: clock.now()
                    });
                    transaction.set(auditRef, {
                        schemaVersion: 2,
                        eventId: command.commandId,
                        orderId,
                        action,
                        actor: {
                            uid: actor.uid,
                            role: actor.role,
                            aal2: actor.aal2
                        },
                        reason,
                        payloadHash: hashPayload(payload),
                        stateVersionBefore: order.stateVersion,
                        stateVersionAfter: result.order.stateVersion,
                        createdAt: clock.now()
                    });
                    if (outbox && !snapshotExists(outboxSnap)) {
                        transaction.set(
                            outboxRef,
                            order.testContext
                                ? { ...outbox, testContext: { ...order.testContext } }
                                : outbox
                        );
                    }
                },
                failpoints
            }).then((result) => result.response || result);
        });
    }

    return Object.freeze({ execute });
}

module.exports = {
    createOrderCommandRepository,
    emailTemplateForAction,
    eventForAction
};
