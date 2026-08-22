'use strict';

const crypto = require('node:crypto');
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const {
    checkActiveStrongAdmin,
    getCallerAuditInfo,
    normalizeFirestoreId
} = require('../../helpers/security');
const { AUDIT_RETENTION_DAYS, timestampAfterDays } = require('../../helpers/retention');

const DELETE_SESSION_ACTION = 'DELETE_ANALYTICS_SESSION';
const SECURITY_AUDIT_COLLECTION = 'sys_audit_security';
const SESSION_COLLECTION = 'analytics_sessions';
const OPERATION_ID_PATTERN = /^[A-Za-z0-9_-]{8,160}$/;

const hash = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

function requestError(code, message, details) {
    return new functions.https.HttpsError(code, message, details);
}

function normalizeExpectedUpdateTime(value, { required = false } = {}) {
    if (value === null || value === undefined || value === '') {
        if (required) throw requestError('invalid-argument', 'Precondition de version requise.');
        return null;
    }
    if (typeof value !== 'string') {
        throw requestError('invalid-argument', 'Precondition de version invalide.');
    }
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
        throw requestError('invalid-argument', 'Precondition de version invalide.');
    }
    return value;
}

function normalizeDeleteSessionRequest(data = {}) {
    const mode = data.mode === undefined ? 'dry_run' : data.mode;
    if (!['dry_run', 'commit'].includes(mode)) {
        throw requestError('invalid-argument', 'Mode de maintenance invalide.');
    }
    const sessionId = normalizeFirestoreId(data.sessionId, 'Session');
    const operationId = String(data.operationId || '');
    if (!OPERATION_ID_PATTERN.test(operationId)) {
        throw requestError('invalid-argument', 'Identifiant d operation invalide.');
    }
    const confirmation = data.confirmation;
    if (
        !confirmation || typeof confirmation !== 'object' || Array.isArray(confirmation)
        || confirmation.action !== DELETE_SESSION_ACTION
        || confirmation.sessionId !== sessionId
        || Object.keys(confirmation).sort().join(',') !== 'action,sessionId'
    ) {
        throw requestError('invalid-argument', 'Confirmation structuree invalide.');
    }
    const expectedUpdateTime = normalizeExpectedUpdateTime(data.expectedUpdateTime, {
        required: mode === 'commit'
    });
    return { mode, sessionId, operationId, confirmation, expectedUpdateTime };
}

function snapshotUpdateTime(snapshot) {
    const value = snapshot?.updateTime;
    if (!value || typeof value.toDate !== 'function') {
        throw requestError('failed-precondition', 'Version de session indisponible.');
    }
    return value.toDate().toISOString();
}

function createDeleteSessionHandler({
    db = admin.firestore(),
    checkAdmin = checkActiveStrongAdmin,
    getAuditInfo = getCallerAuditInfo,
    serverTimestamp = () => admin.firestore.FieldValue.serverTimestamp(),
    auditExpiry = () => timestampAfterDays(AUDIT_RETENTION_DAYS),
    authorizationCache = null
} = {}) {
    return async (data = {}, context = {}) => {
        await checkAdmin(context);
        const request = normalizeDeleteSessionRequest(data);
        const sessionRef = db.collection(SESSION_COLLECTION).doc(request.sessionId);

        if (request.mode === 'dry_run') {
            const snapshot = await sessionRef.get();
            return {
                mode: 'dry_run',
                operationId: request.operationId,
                wouldDelete: snapshot.exists,
                batch: { size: snapshot.exists ? 1 : 0, limit: 1, resumable: true },
                precondition: snapshot.exists
                    ? { updateTime: snapshotUpdateTime(snapshot) }
                    : null
            };
        }

        const operationHash = hash(request.operationId);
        const sessionIdHash = hash(request.sessionId);
        const payloadHash = hash(JSON.stringify({
            action: DELETE_SESSION_ACTION,
            sessionId: request.sessionId,
            expectedUpdateTime: request.expectedUpdateTime
        }));
        const auditRef = db.collection(SECURITY_AUDIT_COLLECTION)
            .doc(`maintenance_delete_session_${operationHash}`);

        const transactionResult = await db.runTransaction(async (transaction) => {
            const existingAudit = await transaction.get(auditRef);
            if (existingAudit.exists) {
                const existing = existingAudit.data() || {};
                if (existing.payload?.payloadHash !== payloadHash) {
                    throw requestError('already-exists', 'Identifiant d operation deja utilise avec une autre cible.');
                }
                return { ...existing.payload.result, alreadyApplied: true };
            }

            const snapshot = await transaction.get(sessionRef);
            if (!snapshot.exists) {
                throw requestError('not-found', 'Session introuvable.');
            }
            const observedUpdateTime = snapshotUpdateTime(snapshot);
            if (observedUpdateTime !== request.expectedUpdateTime) {
                throw requestError('failed-precondition', 'La session a change depuis le dry-run.', {
                    reason: 'SESSION_VERSION_CHANGED'
                });
            }

            const result = {
                mode: 'commit',
                operationId: request.operationId,
                deleted: true,
                alreadyApplied: false
            };
            transaction.delete(sessionRef);
            transaction.set(auditRef, {
                eventType: 'maintenance.delete_analytics_session',
                caller: getAuditInfo(context),
                payload: {
                    operationIdHash: operationHash,
                    sessionIdHash,
                    payloadHash,
                    result
                },
                createdAt: serverTimestamp(),
                expireAt: auditExpiry()
            });
            return result;
        });

        authorizationCache?.remove?.(request.sessionId);
        return transactionResult;
    };
}

module.exports = {
    DELETE_SESSION_ACTION,
    createDeleteSessionHandler,
    normalizeDeleteSessionRequest
};
