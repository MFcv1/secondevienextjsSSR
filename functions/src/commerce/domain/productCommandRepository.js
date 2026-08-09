'use strict';

const { executeIdempotentCommand, hashPayload, validateCommand } = require('./idempotency');
const {
    applyProductAction,
    assertProductIdentity,
    assertStrongAdmin,
    validateExistingProduct
} = require('./productCommands');

function repositoryError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function snapshotExists(snapshot) {
    return typeof snapshot.exists === 'function' ? snapshot.exists() : snapshot.exists === true;
}

function createProductCommandRepository({ db, refs, clock, failpoints = null }) {
    if (
        typeof db?.runTransaction !== 'function' ||
        typeof refs?.product !== 'function' ||
        typeof refs?.commandResult !== 'function' ||
        typeof refs?.productAuditEvent !== 'function' ||
        typeof clock?.now !== 'function'
    ) {
        throw repositoryError('COMMERCE_PRODUCT_REPOSITORY_DEPENDENCY_INVALID');
    }

    async function execute({
        collectionName = 'furniture',
        productId,
        action,
        command,
        actor,
        reason,
        payload = {}
    }) {
        assertProductIdentity(collectionName, productId);
        assertStrongAdmin(actor);
        validateCommand(command);
        if (typeof reason !== 'string' || reason.length < 3 || reason.length > 500) {
            throw repositoryError('COMMERCE_PRODUCT_REASON_INVALID');
        }

        const productRef = refs.product({ collectionName, productId });
        const commandRef = refs.commandResult(command.commandId);
        const auditRef = refs.productAuditEvent(collectionName, productId, command.commandId);
        const commandPayload = {
            action,
            collectionName,
            productId,
            payload,
            actorUid: actor.uid,
            reason
        };

        return db.runTransaction(async (transaction) => {
            const [commandSnap, productSnap, auditSnap] = await Promise.all([
                transaction.get(commandRef),
                transaction.get(productRef),
                transaction.get(auditRef)
            ]);
            const existingResult = snapshotExists(commandSnap) ? commandSnap.data() : null;
            if (existingResult && existingResult.actorUid !== actor.uid) {
                throw repositoryError('COMMERCE_COMMAND_RESULT_ACCESS_DENIED');
            }
            const existingProduct = snapshotExists(productSnap) ? productSnap.data() : null;
            const version = existingProduct ? validateExistingProduct(existingProduct).commerceVersion : 0;
            const versionCarrier = {
                stateVersion: version,
                product: existingProduct
            };

            return executeIdempotentCommand({
                order: versionCarrier,
                command: {
                    ...command,
                    payload: commandPayload
                },
                lookupResult: async () => existingResult,
                transition: () => {
                    if (!['create_product', 'create_published_product'].includes(action) && !existingProduct) {
                        throw repositoryError('COMMERCE_PRODUCT_NOT_FOUND');
                    }
                    const now = clock.now();
                    const nextProduct = applyProductAction({
                        action,
                        product: existingProduct,
                        payload,
                        actor,
                        reason,
                        now
                    });
                    if (!nextProduct) {
                        throw repositoryError('COMMERCE_PRODUCT_SOURCE_RETENTION_REQUIRED');
                    }
                    return {
                        product: nextProduct,
                        response: {
                            productId,
                            collectionName,
                            commandId: command.commandId,
                            action,
                            commerceVersion: nextProduct.commerceVersion,
                            inventoryVersion: nextProduct.inventoryVersion ?? existingProduct?.inventoryVersion ?? 0,
                            status: nextProduct.status
                        }
                    };
                },
                persistResult: async (record) => {
                    if (snapshotExists(auditSnap)) {
                        throw repositoryError('COMMERCE_AUDIT_APPEND_ONLY_CONFLICT');
                    }
                    const now = clock.now();
                    transaction.set(productRef, record.result.product);
                    transaction.set(commandRef, {
                        schemaVersion: 2,
                        commandId: command.commandId,
                        productId,
                        collectionName,
                        action,
                        actorUid: actor.uid,
                        payloadHash: record.payloadHash,
                        result: record.result.response,
                        createdAt: now
                    });
                    transaction.set(auditRef, {
                        schemaVersion: 2,
                        eventId: command.commandId,
                        productId,
                        collectionName,
                        action,
                        actor: {
                            uid: actor.uid,
                            role: actor.role,
                            aal2: actor.aal2
                        },
                        reason,
                        payloadHash: hashPayload(payload),
                        commerceVersionBefore: version,
                        commerceVersionAfter: record.result.product?.commerceVersion ?? null,
                        inventoryVersionBefore: existingProduct?.inventoryVersion ?? null,
                        inventoryVersionAfter: record.result.product?.inventoryVersion ?? null,
                        createdAt: now
                    });
                },
                failpoints
            }).then((result) => result.response || result);
        });
    }

    return Object.freeze({ execute });
}

module.exports = {
    createProductCommandRepository
};
