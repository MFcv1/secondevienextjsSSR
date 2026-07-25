'use strict';

const admin = require('firebase-admin');
const { defineString } = require('firebase-functions/params');
const {
    assertConfirmText,
    checkActiveStrongAdmin,
    checkActiveStrongSuperAdmin,
    checkRecentActiveStrongSuperAdmin,
    getSuperAdminEmail,
    normalizeEmail,
    normalizeFirestoreId,
    writeSecurityAudit
} = require('../../helpers/security');
const { SUPER_ADMIN_EMAIL } = require('../../helpers/secrets');
const { functions, regionalFunctions } = require('../../helpers/runtime');
const {
    BILLING_GUIDE_STEPS,
    assertBillingGuideTransition,
    getBillingGuideStepRank,
    isBillingGuideEligible,
    normalizeBillingAccountId,
    normalizeBillingGuideMode,
    normalizeBillingGuideStep
} = require('./billingGuideContract');

const BILLING_GUIDE_MODE = defineString('BILLING_GUIDE_MODE', { default: 'disabled' });
const BILLING_GUIDE_TEST_UID = defineString('BILLING_GUIDE_TEST_UID', { default: '' });
const BILLING_GUIDE_LIVE_UID = defineString('BILLING_GUIDE_LIVE_UID', { default: '' });
const BILLING_GUIDE_TECHNICAL_EMAIL = defineString('BILLING_GUIDE_TECHNICAL_EMAIL', { default: '' });

const COLLECTION = 'sys_billing_onboarding';
const COMPLETE_CONFIRMATION = 'VALIDER LA FACTURATION';
const RESET_CONFIRMATION = 'REINITIALISER LE TEST';

const db = admin.firestore();

function getParamValue(param, envName) {
    return String(process.env[envName] || param.value() || '').trim();
}

function getBillingGuideConfig() {
    const mode = normalizeBillingGuideMode(getParamValue(BILLING_GUIDE_MODE, 'BILLING_GUIDE_MODE'));
    return {
        mode,
        testUid: getParamValue(BILLING_GUIDE_TEST_UID, 'BILLING_GUIDE_TEST_UID'),
        liveUid: getParamValue(BILLING_GUIDE_LIVE_UID, 'BILLING_GUIDE_LIVE_UID'),
        technicalEmail: normalizeEmail(
            getParamValue(BILLING_GUIDE_TECHNICAL_EMAIL, 'BILLING_GUIDE_TECHNICAL_EMAIL')
            || getSuperAdminEmail()
        )
    };
}

function getConfiguredTargetUid(config) {
    if (config.mode === 'test') return config.testUid;
    if (config.mode === 'live') return config.liveUid;
    return '';
}

function getTimestampMillis(value) {
    return typeof value?.toMillis === 'function' ? value.toMillis() : null;
}

function getEmptyState(mode, context) {
    return {
        uid: context.auth.uid,
        email: normalizeEmail(context.auth.token.email),
        mode,
        status: 'in_progress',
        currentStepId: BILLING_GUIDE_STEPS[0],
        furthestStepRank: 0,
        billingAccountId: '',
        confirmations: {
            billingCreated: false,
            billingIdConfirmed: false,
            technicalAccessGranted: false
        }
    };
}

function getJourneyState(snapshot, mode, context) {
    if (!snapshot.exists) return getEmptyState(mode, context);
    const stored = snapshot.data() || {};
    if (stored.mode !== mode || stored.uid !== context.auth.uid) {
        return getEmptyState(mode, context);
    }
    return {
        ...getEmptyState(mode, context),
        ...stored,
        confirmations: {
            ...getEmptyState(mode, context).confirmations,
            ...(stored.confirmations || {})
        }
    };
}

function serializeClientState(state) {
    return {
        status: state.status || 'in_progress',
        currentStepId: state.currentStepId || BILLING_GUIDE_STEPS[0],
        furthestStepRank: Number(state.furthestStepRank) || 0,
        billingAccountId: state.billingAccountId || '',
        confirmations: {
            billingCreated: state.confirmations?.billingCreated === true,
            billingIdConfirmed: state.confirmations?.billingIdConfirmed === true,
            technicalAccessGranted: state.confirmations?.technicalAccessGranted === true
        },
        updatedAt: getTimestampMillis(state.updatedAt),
        completedAt: getTimestampMillis(state.completedAt)
    };
}

function assertEligible(config, adminInfo, context) {
    if (!isBillingGuideEligible({
        mode: config.mode,
        isSuperAdmin: adminInfo.isSuper,
        uid: context.auth.uid,
        testUid: config.testUid,
        liveUid: config.liveUid
    })) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Ce compte ne fait pas partie du parcours de facturation actif.'
        );
    }
}

function asHttpsInvalidArgument(error) {
    if (error instanceof functions.https.HttpsError) return error;
    return new functions.https.HttpsError('invalid-argument', error?.message || 'Donnees onboarding invalides.');
}

exports.getBillingGuideStatus = regionalFunctions().runWith({
    enforceAppCheck: true,
    secrets: [SUPER_ADMIN_EMAIL]
}).https.onCall(async (_data, context) => {
    const adminInfo = await checkActiveStrongAdmin(context);
    const config = getBillingGuideConfig();
    const eligible = isBillingGuideEligible({
        mode: config.mode,
        isSuperAdmin: adminInfo.isSuper,
        uid: context.auth.uid,
        testUid: config.testUid,
        liveUid: config.liveUid
    });

    if (!eligible) {
        return {
            mode: config.mode,
            required: false,
            bypass: adminInfo.isSuper === true,
            technicalEmail: adminInfo.isSuper ? config.technicalEmail : ''
        };
    }

    const snapshot = await db.collection(COLLECTION).doc(context.auth.uid).get();
    const state = getJourneyState(snapshot, config.mode, context);
    return {
        mode: config.mode,
        required: state.status !== 'completed',
        bypass: false,
        technicalEmail: config.technicalEmail,
        state: serializeClientState(state)
    };
});

exports.saveBillingGuideProgress = regionalFunctions().runWith({
    enforceAppCheck: true,
    secrets: [SUPER_ADMIN_EMAIL]
}).https.onCall(async (data, context) => {
    const adminInfo = await checkActiveStrongAdmin(context);
    const config = getBillingGuideConfig();
    assertEligible(config, adminInfo, context);

    const ref = db.collection(COLLECTION).doc(context.auth.uid);
    let savedState = null;

    try {
        await db.runTransaction(async (transaction) => {
            const snapshot = await transaction.get(ref);
            const current = getJourneyState(snapshot, config.mode, context);
            if (current.status === 'completed') {
                throw new functions.https.HttpsError('failed-precondition', 'Ce parcours est deja termine.');
            }

            const nextStepId = normalizeBillingGuideStep(data?.stepId);
            const nextRank = assertBillingGuideTransition({
                currentRank: getBillingGuideStepRank(current.currentStepId),
                furthestRank: current.furthestStepRank,
                nextStepId
            });
            const confirmations = {
                billingCreated: data?.confirmations?.billingCreated === true || current.confirmations.billingCreated,
                billingIdConfirmed: data?.confirmations?.billingIdConfirmed === true || current.confirmations.billingIdConfirmed,
                technicalAccessGranted: data?.confirmations?.technicalAccessGranted === true || current.confirmations.technicalAccessGranted
            };
            const suppliedBillingAccountId = String(data?.billingAccountId || '').trim();
            let billingAccountId = current.billingAccountId;
            if (suppliedBillingAccountId) {
                try {
                    billingAccountId = normalizeBillingAccountId(suppliedBillingAccountId);
                } catch (error) {
                    if (nextRank >= getBillingGuideStepRank('technical_access')) throw error;
                }
            }

            if (nextRank >= getBillingGuideStepRank('billing_id') && !confirmations.billingCreated) {
                throw new TypeError('Confirmez d abord la creation du compte chez Google.');
            }
            if (nextRank >= getBillingGuideStepRank('technical_access')) {
                if (!billingAccountId || !confirmations.billingIdConfirmed) {
                    throw new TypeError('Confirmez l identifiant de facturation avant de continuer.');
                }
            }
            if (nextStepId === 'waiting_for_operator' && !confirmations.technicalAccessGranted) {
                throw new TypeError('Confirmez l autorisation technique avant de terminer.');
            }
            if (nextStepId === 'waiting_for_operator' && !config.technicalEmail) {
                throw new functions.https.HttpsError(
                    'failed-precondition',
                    'L adresse technique doit etre configuree cote serveur avant ce test.'
                );
            }

            const now = admin.firestore.FieldValue.serverTimestamp();
            savedState = {
                ...current,
                uid: context.auth.uid,
                email: normalizeEmail(context.auth.token.email),
                mode: config.mode,
                status: nextStepId === 'waiting_for_operator' ? 'waiting_for_operator' : 'in_progress',
                currentStepId: nextStepId,
                furthestStepRank: Math.max(Number(current.furthestStepRank) || 0, nextRank),
                billingAccountId,
                confirmations,
                startedAt: current.startedAt || now,
                updatedAt: now,
                waitingAt: nextStepId === 'waiting_for_operator' ? now : current.waitingAt || null,
                version: 1
            };
            transaction.set(ref, savedState, { merge: false });
        });
    } catch (error) {
        throw asHttpsInvalidArgument(error);
    }

    if (savedState.status === 'waiting_for_operator') {
        await writeSecurityAudit('billing_onboarding.client_ready', context, {
            targetUid: context.auth.uid,
            mode: config.mode
        });
    }

    return {
        success: true,
        mode: config.mode,
        required: true,
        state: serializeClientState(savedState)
    };
});

exports.getBillingGuideOperatorStatus = regionalFunctions().runWith({
    enforceAppCheck: true,
    secrets: [SUPER_ADMIN_EMAIL]
}).https.onCall(async (_data, context) => {
    await checkActiveStrongSuperAdmin(context);
    const config = getBillingGuideConfig();
    if (!['test', 'live'].includes(config.mode)) {
        return { mode: config.mode, journey: null };
    }

    const targetUid = getConfiguredTargetUid(config);
    if (!targetUid) return { mode: config.mode, journey: null };
    const snapshot = await db.collection(COLLECTION).doc(targetUid).get();
    const item = snapshot.exists ? snapshot.data() : null;
    const journey = item?.mode === config.mode
        ? {
            uid: item.uid || targetUid,
            email: item.email || '',
            billingAccountId: item.billingAccountId || '',
            status: item.status || 'in_progress',
            updatedAt: getTimestampMillis(item.updatedAt)
        }
        : null;

    return { mode: config.mode, journey };
});

exports.completeBillingGuideAdmin = regionalFunctions().runWith({
    enforceAppCheck: true,
    secrets: [SUPER_ADMIN_EMAIL]
}).https.onCall(async (data, context) => {
    await checkRecentActiveStrongSuperAdmin(context);
    assertConfirmText(data, COMPLETE_CONFIRMATION, 'validation facturation');
    const targetUid = normalizeFirestoreId(data?.targetUid, 'Compte client');
    const config = getBillingGuideConfig();
    if (!['test', 'live'].includes(config.mode)) {
        throw new functions.https.HttpsError('failed-precondition', 'Le guide de facturation n est pas actif.');
    }
    if (targetUid !== getConfiguredTargetUid(config)) {
        throw new functions.https.HttpsError('permission-denied', 'Ce compte n est pas la cible du mode actif.');
    }

    const ref = db.collection(COLLECTION).doc(targetUid);
    await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        const current = snapshot.exists ? snapshot.data() : null;
        if (!current || current.mode !== config.mode || current.status !== 'waiting_for_operator') {
            throw new functions.https.HttpsError('failed-precondition', 'Aucun parcours en attente pour ce compte.');
        }
        transaction.update(ref, {
            status: 'completed',
            currentStepId: 'waiting_for_operator',
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            completedByUid: context.auth.uid,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    });
    await writeSecurityAudit('billing_onboarding.completed', context, {
        targetUid,
        mode: config.mode
    });
    return { success: true, targetUid };
});

exports.resetBillingGuideTest = regionalFunctions().runWith({
    enforceAppCheck: true,
    secrets: [SUPER_ADMIN_EMAIL]
}).https.onCall(async (data, context) => {
    await checkRecentActiveStrongSuperAdmin(context);
    assertConfirmText(data, RESET_CONFIRMATION, 'reinitialisation test');
    const targetUid = normalizeFirestoreId(data?.targetUid, 'Compte test');
    const config = getBillingGuideConfig();
    if (config.mode !== 'test') {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'La reinitialisation est reservee au mode test.'
        );
    }
    if (targetUid !== config.testUid) {
        throw new functions.https.HttpsError('permission-denied', 'Ce compte n est pas la cible du mode test.');
    }

    await db.collection(COLLECTION).doc(targetUid).delete();
    await writeSecurityAudit('billing_onboarding.test_reset', context, {
        targetUid,
        mode: config.mode
    });
    return { success: true, targetUid };
});
