'use strict';

const crypto = require('node:crypto');
const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const {
    checkActiveStrongAdmin,
    writeSecurityAudit
} = require('../../helpers/security');
const { regionalFunctions } = require('../../helpers/runtime');
const {
    normalizeCommerceControl,
    validateCommercePolicy
} = require('./domain/policy');

const CONTROL_PATH = 'sys_commerce_control/current';
const DELIVERY_METADATA_PATH = 'sys_metadata/delivery';
const MAX_DELIVERY_PRICE_CENTS = 1_000_000;

const DELIVERY_MODE_CONFIG = Object.freeze([
    Object.freeze({
        key: 'retrait',
        policyId: 'delivery-pickup',
        label: "Retrait à l'atelier (Marseille)",
        sub: 'Sur rendez-vous'
    }),
    Object.freeze({
        key: 'idf',
        policyId: 'delivery-local',
        label: 'Livraison Marseille & Alentours',
        sub: 'Par nos soins'
    }),
    Object.freeze({
        key: 'transporteur',
        policyId: 'delivery-carrier',
        label: 'Transporteur Spécialisé (Cocolis)',
        sub: 'Protections sur-mesure'
    })
]);

function snapshotExists(snapshot) {
    return typeof snapshot?.exists === 'function'
        ? snapshot.exists()
        : snapshot?.exists === true;
}

function deliveryPolicyError(code, message) {
    const error = new Error(message || code);
    error.code = code;
    return error;
}

function normalizeText(value, label, { required = false, max = 160 } = {}) {
    if (typeof value !== 'string') {
        throw deliveryPolicyError('COMMERCE_DELIVERY_POLICY_INPUT_INVALID', `${label} invalide.`);
    }
    const normalized = value.trim();
    if ((required && !normalized) || normalized.length > max) {
        throw deliveryPolicyError('COMMERCE_DELIVERY_POLICY_INPUT_INVALID', `${label} invalide.`);
    }
    return normalized;
}

function normalizeDeliverySettings(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw deliveryPolicyError('COMMERCE_DELIVERY_POLICY_INPUT_INVALID');
    }
    const settings = {};
    let activeCount = 0;
    for (const config of DELIVERY_MODE_CONFIG) {
        const mode = input[config.key];
        if (!mode || typeof mode !== 'object' || Array.isArray(mode)) {
            throw deliveryPolicyError('COMMERCE_DELIVERY_POLICY_INPUT_INVALID', `Mode ${config.key} invalide.`);
        }
        const amount = Number(mode.price);
        const shippingCents = Math.round(amount * 100);
        if (
            typeof mode.active !== 'boolean' ||
            !Number.isFinite(amount) ||
            amount < 0 ||
            !Number.isSafeInteger(shippingCents) ||
            shippingCents > MAX_DELIVERY_PRICE_CENTS
        ) {
            throw deliveryPolicyError('COMMERCE_DELIVERY_POLICY_INPUT_INVALID', `Tarif ${config.key} invalide.`);
        }
        if (mode.active) activeCount += 1;
        settings[config.key] = {
            id: config.key,
            active: mode.active,
            label: normalizeText(mode.label, `Libellé ${config.key}`, { required: true, max: 100 }),
            sub: normalizeText(mode.sub || '', `Description ${config.key}`, { max: 160 }),
            price: shippingCents / 100,
            shippingCents
        };
    }
    if (activeCount === 0) {
        throw deliveryPolicyError(
            'COMMERCE_DELIVERY_POLICY_INPUT_INVALID',
            'Au moins un mode de livraison doit rester actif.'
        );
    }
    return settings;
}

function settingsFromPolicy(policy, metadata = {}) {
    validateCommercePolicy(policy);
    const settings = {};
    for (const config of DELIVERY_MODE_CONFIG) {
        const policyMode = policy.deliveryModes.find((mode) => mode.id === config.policyId);
        if (!policyMode) {
            throw deliveryPolicyError(
                'COMMERCE_DELIVERY_POLICY_MODE_MISSING',
                `Le mode ${config.policyId} est absent de la politique active.`
            );
        }
        const stored = metadata?.[config.key] || {};
        settings[config.key] = {
            id: config.key,
            active: policyMode.active,
            label: String(stored.label || policyMode.label || config.label).trim().slice(0, 100),
            sub: String(stored.sub || policyMode.description || config.sub).trim().slice(0, 160),
            price: policyMode.shippingCents / 100
        };
    }
    return settings;
}

function buildNextPolicy(currentPolicy, normalizedSettings, version) {
    const configByPolicyId = new Map(DELIVERY_MODE_CONFIG.map((config) => [config.policyId, config]));
    const nextPolicy = {
        ...currentPolicy,
        version,
        deliveryModes: currentPolicy.deliveryModes.map((mode) => {
            const config = configByPolicyId.get(mode.id);
            if (!config) return { ...mode };
            const setting = normalizedSettings[config.key];
            return {
                ...mode,
                active: setting.active,
                shippingCents: setting.shippingCents,
                label: setting.label,
                description: setting.sub
            };
        }),
        active: true,
        updatedAt: new Date().toISOString()
    };
    validateCommercePolicy(nextPolicy);
    return nextPolicy;
}

function publicDeliveryProjection(normalizedSettings) {
    return Object.fromEntries(DELIVERY_MODE_CONFIG.map((config) => {
        const setting = normalizedSettings[config.key];
        return [config.key, {
            id: config.key,
            active: setting.active,
            label: setting.label,
            sub: setting.sub,
            price: setting.price
        }];
    }));
}

function mapError(error) {
    if (error instanceof functions.https.HttpsError) return error;
    if (String(error?.code || '').startsWith('COMMERCE_DELIVERY_POLICY_')) {
        return new functions.https.HttpsError(
            error.code === 'COMMERCE_DELIVERY_POLICY_STALE' ? 'aborted' : 'invalid-argument',
            error.message || 'Configuration de livraison invalide.',
            { reason: error.code }
        );
    }
    console.error('Delivery policy admin error:', error);
    return new functions.https.HttpsError(
        'internal',
        'La configuration de livraison n’a pas pu être enregistrée.'
    );
}

function policyVersion() {
    return `policy_admin_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function createDeliveryPolicyHandlers({
    db = null,
    versionFactory = policyVersion,
    authorize = checkActiveStrongAdmin,
    audit = writeSecurityAudit
} = {}) {
    const get = async (_data, context) => {
        try {
            await authorize(context);
            const firestore = db || admin.firestore();
            const controlRef = firestore.doc(CONTROL_PATH);
            const metadataRef = firestore.doc(DELIVERY_METADATA_PATH);
            return await firestore.runTransaction(async (transaction) => {
                const controlSnapshot = await transaction.get(controlRef);
                const control = normalizeCommerceControl(
                    snapshotExists(controlSnapshot) ? controlSnapshot.data() : null
                );
                if (!control.activePolicyVersion) {
                    throw deliveryPolicyError('COMMERCE_DELIVERY_POLICY_MISSING');
                }
                const metadataSnapshot = await transaction.get(metadataRef);
                const policySnapshot = await transaction.get(firestore.doc(
                    `commerce_policy_versions/${control.activePolicyVersion}`
                ));
                if (!snapshotExists(policySnapshot)) {
                    throw deliveryPolicyError('COMMERCE_DELIVERY_POLICY_MISSING');
                }
                return {
                    settings: settingsFromPolicy(
                        policySnapshot.data(),
                        snapshotExists(metadataSnapshot) ? metadataSnapshot.data() : {}
                    ),
                    policyVersion: control.activePolicyVersion,
                    controlRevision: control.controlRevision
                };
            });
        } catch (error) {
            throw mapError(error);
        }
    };

    const save = async (data, context) => {
        try {
            await authorize(context);
            const firestore = db || admin.firestore();
            const normalizedSettings = normalizeDeliverySettings(data?.settings);
            const expectedControlRevision = Number(data?.expectedControlRevision);
            const sourcePolicyVersion = String(data?.sourcePolicyVersion || '').trim();
            if (!Number.isSafeInteger(expectedControlRevision) || expectedControlRevision < 0 || !sourcePolicyVersion) {
                throw deliveryPolicyError('COMMERCE_DELIVERY_POLICY_INPUT_INVALID');
            }
            const nextVersion = versionFactory();
            const result = await firestore.runTransaction(async (transaction) => {
                const controlRef = firestore.doc(CONTROL_PATH);
                const controlSnapshot = await transaction.get(controlRef);
                const control = normalizeCommerceControl(
                    snapshotExists(controlSnapshot) ? controlSnapshot.data() : null
                );
                if (
                    control.adminMutationMode !== 'v2' ||
                    control.newCheckoutMode !== 'v2_all' ||
                    !control.activePolicyVersion
                ) {
                    throw new functions.https.HttpsError(
                        'failed-precondition',
                        'Les modifications de livraison ne sont pas actives sur cet environnement.',
                        { reason: 'COMMERCE_ADMIN_MUTATIONS_OFF' }
                    );
                }
                if (
                    control.controlRevision !== expectedControlRevision ||
                    control.activePolicyVersion !== sourcePolicyVersion
                ) {
                    throw deliveryPolicyError(
                        'COMMERCE_DELIVERY_POLICY_STALE',
                        'La configuration a changé. Rechargez-la avant de réessayer.'
                    );
                }
                const currentPolicyRef = firestore.doc(`commerce_policy_versions/${control.activePolicyVersion}`);
                const currentPolicySnapshot = await transaction.get(currentPolicyRef);
                if (!snapshotExists(currentPolicySnapshot)) {
                    throw deliveryPolicyError('COMMERCE_DELIVERY_POLICY_MISSING');
                }
                const nextPolicy = buildNextPolicy(
                    currentPolicySnapshot.data(),
                    normalizedSettings,
                    nextVersion
                );
                const nextPolicyRef = firestore.doc(`commerce_policy_versions/${nextVersion}`);
                transaction.create(nextPolicyRef, {
                    ...nextPolicy,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    createdBy: context.auth.uid,
                    sourcePolicyVersion: control.activePolicyVersion
                });
                transaction.update(controlRef, {
                    activePolicyVersion: nextVersion,
                    controlRevision: control.controlRevision + 1,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedBy: context.auth.uid
                });
                transaction.set(
                    firestore.doc(DELIVERY_METADATA_PATH),
                    publicDeliveryProjection(normalizedSettings)
                );
                return {
                    settings: publicDeliveryProjection(normalizedSettings),
                    policyVersion: nextVersion,
                    previousPolicyVersion: control.activePolicyVersion,
                    controlRevision: control.controlRevision + 1
                };
            });
            await audit('commerce.delivery_policy_updated', context, {
                previousPolicyVersion: result.previousPolicyVersion,
                policyVersion: result.policyVersion,
                controlRevision: result.controlRevision
            });
            return result;
        } catch (error) {
            throw mapError(error);
        }
    };

    return { get, save };
}

const handlers = createDeliveryPolicyHandlers();
const getDeliveryPolicyAdmin = regionalFunctions()
    .runWith({ enforceAppCheck: true })
    .https.onCall(handlers.get);
const saveDeliveryPolicyAdmin = regionalFunctions()
    .runWith({ enforceAppCheck: true })
    .https.onCall(handlers.save);

module.exports = {
    DELIVERY_MODE_CONFIG,
    buildNextPolicy,
    createDeliveryPolicyHandlers,
    getDeliveryPolicyAdmin,
    normalizeDeliverySettings,
    publicDeliveryProjection,
    saveDeliveryPolicyAdmin,
    settingsFromPolicy
};
