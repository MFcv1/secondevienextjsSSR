'use strict';

const crypto = require('node:crypto');
const { hashPayload } = require('./idempotency');
const { deriveInventoryStatus, validateInventorySummary } = require('./inventoryInvariants');

const MOVEMENT_TYPES = Object.freeze(['hold', 'commit', 'release']);

function reservationError(code, detail) {
    const error = new Error(detail ? `${code}:${detail}` : code);
    error.code = code;
    if (detail) error.detail = detail;
    return error;
}

function effectIdFor(type, orderId, inventoryKey) {
    return crypto.createHash('sha256')
        .update(`v1|${type}|${orderId}|${inventoryKey}`)
        .digest('hex');
}

function snapshotExists(snapshot) {
    return typeof snapshot.exists === 'function' ? snapshot.exists() : snapshot.exists === true;
}

function validateMutationInput({ type, orderId, commandId, groups, actor, reason }) {
    if (!MOVEMENT_TYPES.includes(type)) throw reservationError('COMMERCE_MOVEMENT_TYPE_INVALID');
    for (const [field, value] of Object.entries({ orderId, commandId, actor, reason })) {
        if (typeof value !== 'string' || value.length < 3 || value.length > 200) {
            throw reservationError('COMMERCE_RESERVATION_INPUT_INVALID', field);
        }
    }
    if (!Array.isArray(groups) || groups.length === 0 || groups.length > 50) {
        throw reservationError('COMMERCE_RESERVATION_INPUT_INVALID', 'groups');
    }
    for (const group of groups) {
        if (
            typeof group.inventoryKey !== 'string' ||
            !/^[a-f0-9]{64}$/.test(group.inventoryKey) ||
            !Number.isSafeInteger(group.quantity) ||
            group.quantity <= 0
        ) {
            throw reservationError('COMMERCE_RESERVATION_INPUT_INVALID', 'group');
        }
    }
}

function createReservationRepository({ db, refs, clock }) {
    if (
        !db ||
        typeof db.runTransaction !== 'function' ||
        !refs ||
        typeof refs.product !== 'function' ||
        typeof refs.reservation !== 'function' ||
        typeof refs.movement !== 'function' ||
        !clock ||
        typeof clock.now !== 'function'
    ) {
        throw reservationError('COMMERCE_RESERVATION_DEPENDENCY_INVALID');
    }

    return Object.freeze({
        async applyMovement(input) {
            validateMutationInput(input);
            const sortedGroups = [...input.groups].sort(
                (left, right) => left.inventoryKey.localeCompare(right.inventoryKey)
            );
            return db.runTransaction(async (transaction) => {
                const entries = sortedGroups.map((group) => {
                    const effectId = effectIdFor(input.type, input.orderId, group.inventoryKey);
                    return {
                        group,
                        effectId,
                        productRef: refs.product(group),
                        reservationRef: refs.reservation(input.orderId, group.inventoryKey),
                        movementRef: refs.movement(effectId)
                    };
                });

                const reads = [];
                for (const entry of entries) {
                    reads.push(transaction.get(entry.movementRef));
                    reads.push(transaction.get(entry.reservationRef));
                    reads.push(transaction.get(entry.productRef));
                }
                const snapshots = await Promise.all(reads);
                const now = clock.now();
                const results = [];

                for (let index = 0; index < entries.length; index += 1) {
                    const entry = entries[index];
                    const movementSnap = snapshots[index * 3];
                    const reservationSnap = snapshots[(index * 3) + 1];
                    const productSnap = snapshots[(index * 3) + 2];
                    const movementPayload = {
                        type: input.type,
                        orderId: input.orderId,
                        inventoryKey: entry.group.inventoryKey,
                        quantity: entry.group.quantity,
                        commandId: input.commandId
                    };
                    const payloadHash = hashPayload(movementPayload);

                    if (snapshotExists(movementSnap)) {
                        const existing = movementSnap.data();
                        if (existing.payloadHash !== payloadHash) {
                            throw reservationError('COMMERCE_MOVEMENT_IDEMPOTENCY_CONFLICT', entry.effectId);
                        }
                        results.push({ effectId: entry.effectId, reused: true });
                        continue;
                    }
                    if (!snapshotExists(productSnap)) {
                        throw reservationError('COMMERCE_INVENTORY_PRODUCT_MISSING', entry.group.inventoryKey);
                    }

                    const product = productSnap.data();
                    const stock = product.stock;
                    const inventoryVersion = product.inventoryVersion ?? 0;
                    if (!Number.isSafeInteger(stock) || stock < 0 || !Number.isSafeInteger(inventoryVersion)) {
                        throw reservationError('COMMERCE_INVENTORY_PRODUCT_INVALID', entry.group.inventoryKey);
                    }

                    let reservation;
                    let availableDelta = 0;
                    if (input.type === 'hold') {
                        if (snapshotExists(reservationSnap)) {
                            throw reservationError('COMMERCE_RESERVATION_ALREADY_EXISTS', entry.group.inventoryKey);
                        }
                        if (stock < entry.group.quantity) {
                            throw reservationError('COMMERCE_INVENTORY_INSUFFICIENT', entry.group.inventoryKey);
                        }
                        availableDelta = -entry.group.quantity;
                        reservation = {
                            schemaVersion: 2,
                            orderId: input.orderId,
                            inventoryKey: entry.group.inventoryKey,
                            productId: entry.group.productId,
                            collectionName: entry.group.collectionName,
                            variantId: entry.group.variantId ?? null,
                            lineAllocations: entry.group.lineAllocations || [],
                            status: 'held',
                            reservedQty: entry.group.quantity,
                            heldQty: entry.group.quantity,
                            committedQty: 0,
                            releasedQty: 0,
                            dispositionPendingQty: 0,
                            restockedQty: 0,
                            writtenOffQty: 0,
                            inventoryVersion: inventoryVersion + 1,
                            stateVersion: 0,
                            expiresAt: input.expiresAt ?? null,
                            createdAt: now,
                            updatedAt: now
                        };
                    } else {
                        if (!snapshotExists(reservationSnap)) {
                            throw reservationError('COMMERCE_RESERVATION_MISSING', entry.group.inventoryKey);
                        }
                        reservation = { ...reservationSnap.data() };
                        if (reservation.orderId !== input.orderId || reservation.inventoryKey !== entry.group.inventoryKey) {
                            throw reservationError('COMMERCE_RESERVATION_IDENTITY_MISMATCH', entry.group.inventoryKey);
                        }
                        if (reservation.heldQty < entry.group.quantity) {
                            throw reservationError('COMMERCE_RESERVATION_QUANTITY_CONFLICT', entry.group.inventoryKey);
                        }
                        reservation.heldQty -= entry.group.quantity;
                        if (input.type === 'release') {
                            reservation.releasedQty += entry.group.quantity;
                            availableDelta = entry.group.quantity;
                        } else {
                            reservation.committedQty += entry.group.quantity;
                        }
                        reservation.stateVersion += 1;
                        reservation.inventoryVersion = inventoryVersion + (availableDelta === 0 ? 0 : 1);
                        reservation.updatedAt = now;
                        reservation.status = deriveInventoryStatus(reservation);
                    }
                    validateInventorySummary(reservation);

                    if (availableDelta !== 0) {
                        transaction.update(entry.productRef, {
                            stock: stock + availableDelta,
                            inventoryVersion: inventoryVersion + 1
                        });
                    }
                    transaction.set(entry.reservationRef, reservation);
                    transaction.set(entry.movementRef, {
                        schemaVersion: 2,
                        effectId: entry.effectId,
                        reservationId: `${input.orderId}_${entry.group.inventoryKey}`,
                        orderId: input.orderId,
                        inventoryKey: entry.group.inventoryKey,
                        type: input.type,
                        quantity: entry.group.quantity,
                        availableDelta,
                        inventoryVersionBefore: inventoryVersion,
                        inventoryVersionAfter: inventoryVersion + (availableDelta === 0 ? 0 : 1),
                        commandId: input.commandId,
                        actor: input.actor,
                        reason: input.reason,
                        payloadHash,
                        createdAt: now
                    });
                    results.push({ effectId: entry.effectId, reused: false });
                }
                return results;
            });
        }
    });
}

module.exports = {
    MOVEMENT_TYPES,
    createReservationRepository,
    effectIdFor
};
