const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const Stripe = require('stripe');
const { STRIPE_SECRET_KEY, SUPER_ADMIN_EMAIL: SUPER_ADMIN_EMAIL_SECRET } = require('../../helpers/secrets');
const { checkIsAdmin, normalizeEmail, getSuperAdminEmail } = require('../../helpers/security');

const db = admin.firestore();
const CONNECT_DOC_REF = db.doc('sys_metadata/stripe_connect');
const CONNECT_AUDIT_COLLECTION = 'sys_audit_stripe_connect';
const RECONNECT_REQUEST_TTL_MS = 24 * 60 * 60 * 1000;

function getStripe() {
    return Stripe(STRIPE_SECRET_KEY.value());
}

function getCaller(context) {
    return {
        uid: context.auth?.uid || null,
        email: context.auth?.token?.email || null,
        ip: String(context.rawRequest?.headers?.['x-forwarded-for'] || context.rawRequest?.ip || '').slice(0, 180),
        userAgent: String(context.rawRequest?.headers?.['user-agent'] || '').slice(0, 500)
    };
}

async function checkRecentStripeConnectAdmin(context, maxAgeSeconds = 900) {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentification requise.');
    }

    const authTime = Number(context.auth?.token?.auth_time || 0);
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (!authTime || nowSeconds - authTime > maxAgeSeconds) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'Session admin trop ancienne. Reconnectez-vous avant cette action sensible.'
        );
    }

    if (context.auth.token.superAdmin === true) return;

    const email = normalizeEmail(context.auth.token.email);
    const superAdminEmail = getSuperAdminEmail();
    if (superAdminEmail && context.auth.token.email_verified === true && email === superAdminEmail) return;

    throw new functions.https.HttpsError('permission-denied', 'Acces refuse : Super Admin uniquement.');
}

function sanitizeOrigin(value) {
    const raw = String(value || process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || '').trim();
    if (!raw) {
        throw new functions.https.HttpsError('failed-precondition', 'Origine site manquante pour Stripe Connect.');
    }

    let url;
    try {
        url = new URL(raw);
    } catch {
        throw new functions.https.HttpsError('invalid-argument', 'Origine site invalide pour Stripe Connect.');
    }

    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (url.protocol !== 'https:' && !(isLocal && url.protocol === 'http:')) {
        throw new functions.https.HttpsError('invalid-argument', 'Stripe Connect exige une origine HTTPS hors local.');
    }

    return url.origin;
}

function maskAccountId(accountId) {
    if (!accountId || typeof accountId !== 'string') return null;
    return `${accountId.slice(0, 8)}...${accountId.slice(-4)}`;
}

function getAccountStatus(account) {
    if (!account?.id) return 'not_connected';
    if (account.charges_enabled === true) return 'active';
    if (account.details_submitted === true) return 'pending_review';
    return 'action_required';
}

function serializeRequirements(account) {
    const requirements = account?.requirements || {};
    return {
        currentlyDue: Array.isArray(requirements.currently_due) ? requirements.currently_due.slice(0, 30) : [],
        eventuallyDue: Array.isArray(requirements.eventually_due) ? requirements.eventually_due.slice(0, 30) : [],
        pastDue: Array.isArray(requirements.past_due) ? requirements.past_due.slice(0, 30) : [],
        disabledReason: requirements.disabled_reason || null
    };
}

function publicConnectState(data = {}) {
    const activeAccountId = data.activeAccountId || null;
    const pendingAccountId = data.pendingAccountId || null;
    return {
        status: data.status || 'not_connected',
        activeAccountIdMasked: maskAccountId(activeAccountId),
        pendingAccountIdMasked: maskAccountId(pendingAccountId),
        hasActiveAccount: Boolean(activeAccountId),
        hasPendingAccount: Boolean(pendingAccountId),
        chargesEnabled: data.chargesEnabled === true,
        payoutsEnabled: data.payoutsEnabled === true,
        detailsSubmitted: data.detailsSubmitted === true,
        livemode: data.livemode === true,
        locked: data.locked === true,
        requirements: data.requirements || null,
        lastSyncAt: data.lastSyncAt || null,
        lastWebhookAt: data.lastWebhookAt || null,
        reconnectStatus: data.reconnectRequest?.status || null
    };
}

async function auditConnect(eventType, context, payload = {}) {
    const caller = getCaller(context);
    await db.collection(CONNECT_AUDIT_COLLECTION).add({
        eventType,
        ...payload,
        caller,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }).catch((error) => {
        console.error('Stripe Connect audit write failed:', error);
    });
}

async function retrieveAndPersistAccount(stripe, accountId, { activatePending = false, context = null } = {}) {
    if (!accountId) {
        throw new functions.https.HttpsError('failed-precondition', 'Aucun compte Stripe Connect a synchroniser.');
    }

    const account = await stripe.accounts.retrieve(accountId);
    const status = getAccountStatus(account);
    const updates = {
        status,
        chargesEnabled: account.charges_enabled === true,
        payoutsEnabled: account.payouts_enabled === true,
        detailsSubmitted: account.details_submitted === true,
        livemode: account.livemode === true,
        businessName: account.business_profile?.name || account.settings?.dashboard?.display_name || null,
        country: account.country || null,
        defaultCurrency: account.default_currency || null,
        requirements: serializeRequirements(account),
        lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const snap = await CONNECT_DOC_REF.get();
    const current = snap.exists ? snap.data() : {};
    const canActivate = activatePending && (!current.activeAccountId || current.activeAccountId === accountId);
    if (canActivate && account.charges_enabled === true) {
        updates.activeAccountId = accountId;
        updates.pendingAccountId = admin.firestore.FieldValue.delete();
        updates.connectedAt = current.connectedAt || admin.firestore.FieldValue.serverTimestamp();
        updates.locked = true;
    }

    await CONNECT_DOC_REF.set(updates, { merge: true });
    if (context) {
        await auditConnect('connect_synced', context, {
            accountIdMasked: maskAccountId(accountId),
            status,
            activated: canActivate && account.charges_enabled === true
        });
    }

    const nextSnap = await CONNECT_DOC_REF.get();
    return publicConnectState(nextSnap.exists ? nextSnap.data() : {});
}

async function getStripeConnectRouting() {
    const snap = await CONNECT_DOC_REF.get();
    if (!snap.exists) return { enabled: false, accountId: null, status: 'not_connected' };
    const data = snap.data() || {};
    if (!data.activeAccountId) return { enabled: false, accountId: null, status: data.status || 'not_connected' };
    if (data.chargesEnabled !== true) {
        return { enabled: true, accountId: data.activeAccountId, ready: false, status: data.status || 'action_required' };
    }
    return {
        enabled: true,
        ready: true,
        accountId: data.activeAccountId,
        status: data.status || 'active'
    };
}

exports.getStripeConnectStatus = functions
    .runWith({ secrets: [STRIPE_SECRET_KEY] })
    .https.onCall(async (_data, context) => {
        checkIsAdmin(context);
        const snap = await CONNECT_DOC_REF.get();
        return {
            success: true,
            connect: publicConnectState(snap.exists ? snap.data() : {})
        };
    });

exports.startStripeConnectOnboarding = functions
    .runWith({ secrets: [STRIPE_SECRET_KEY, SUPER_ADMIN_EMAIL_SECRET] })
    .https.onCall(async (data, context) => {
        await checkRecentStripeConnectAdmin(context);
        try {
            const stripe = getStripe();
            const origin = sanitizeOrigin(data?.origin);
            const snap = await CONNECT_DOC_REF.get();
            const current = snap.exists ? snap.data() : {};
            const reconnectRequested = current.reconnectRequest?.status === 'requested';

            if (current.activeAccountId && current.locked !== false && !reconnectRequested) {
                throw new functions.https.HttpsError(
                    'failed-precondition',
                    'Un compte Stripe est deja connecte. Demandez un changement avant de connecter un nouveau compte.'
                );
            }

            let accountId = current.pendingAccountId || null;
            if (!accountId) {
                const account = await stripe.accounts.create({
                    type: 'standard',
                    country: 'FR',
                    email: context.auth.token.email || undefined,
                    business_profile: {
                        product_description: 'Mobilier ancien restaure et pieces uniques.'
                    },
                    metadata: {
                        app: 'secondevie',
                        connectedByUid: context.auth.uid,
                        connectedByEmail: context.auth.token.email || ''
                    }
                });
                accountId = account.id;
                await CONNECT_DOC_REF.set({
                    pendingAccountId: accountId,
                    status: 'action_required',
                    locked: Boolean(current.activeAccountId),
                    onboardingStartedAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    connectedBy: {
                        uid: context.auth.uid,
                        email: context.auth.token.email || null
                    }
                }, { merge: true });
            }

            const accountLink = await stripe.accountLinks.create({
                account: accountId,
                refresh_url: `${origin}/admin?stripe_connect=refresh`,
                return_url: `${origin}/admin?stripe_connect=return`,
                type: 'account_onboarding'
            });

            await auditConnect('connect_onboarding_started', context, {
                accountIdMasked: maskAccountId(accountId),
                reconnect: Boolean(current.activeAccountId)
            });

            return {
                success: true,
                url: accountLink.url,
                accountIdMasked: maskAccountId(accountId)
            };
        } catch (error) {
            if (error instanceof functions.https.HttpsError) throw error;
            if (String(error?.message || '').includes("signed up for Connect")) {
                throw new functions.https.HttpsError(
                    'failed-precondition',
                    'Stripe Connect doit encore etre active sur le compte plateforme Stripe test.'
                );
            }
            console.error('Stripe Connect onboarding failed:', error);
            throw new functions.https.HttpsError('internal', 'Demarrage Stripe Connect impossible.');
        }
    });

exports.syncStripeConnectAccount = functions
    .runWith({ secrets: [STRIPE_SECRET_KEY] })
    .https.onCall(async (_data, context) => {
        checkIsAdmin(context);
        const stripe = getStripe();
        const snap = await CONNECT_DOC_REF.get();
        const current = snap.exists ? snap.data() : {};
        const accountId = current.pendingAccountId || current.activeAccountId || null;
        if (!accountId) {
            return {
                success: true,
                connect: publicConnectState(current),
                message: 'Aucun compte Stripe Connect a synchroniser.'
            };
        }
        const state = await retrieveAndPersistAccount(stripe, accountId, {
            activatePending: !current.activeAccountId,
            context
        });
        return { success: true, connect: state };
    });

exports.requestStripeConnectReconnect = functions
    .runWith({ secrets: [STRIPE_SECRET_KEY, SUPER_ADMIN_EMAIL_SECRET] })
    .https.onCall(async (data, context) => {
        await checkRecentStripeConnectAdmin(context);
        if (String(data?.confirmText || '').trim() !== 'DEMANDER CHANGEMENT STRIPE') {
            throw new functions.https.HttpsError('invalid-argument', 'Phrase de confirmation invalide.');
        }

        const snap = await CONNECT_DOC_REF.get();
        const current = snap.exists ? snap.data() : {};
        if (!current.activeAccountId) {
            throw new functions.https.HttpsError('failed-precondition', 'Aucun compte Stripe actif a remplacer.');
        }

        await CONNECT_DOC_REF.set({
            reconnectRequest: {
                status: 'requested',
                requestedBy: {
                    uid: context.auth.uid,
                    email: context.auth.token.email || null
                },
                requestedAt: admin.firestore.FieldValue.serverTimestamp(),
                requestedAtMillis: Date.now(),
                expiresAtMillis: Date.now() + RECONNECT_REQUEST_TTL_MS
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        await auditConnect('reconnect_requested', context, {
            activeAccountIdMasked: maskAccountId(current.activeAccountId)
        });

        return { success: true };
    });

exports.confirmStripeConnectReconnect = functions
    .runWith({ secrets: [STRIPE_SECRET_KEY, SUPER_ADMIN_EMAIL_SECRET] })
    .https.onCall(async (data, context) => {
        await checkRecentStripeConnectAdmin(context);
        if (String(data?.confirmText || '').trim() !== 'ACTIVER NOUVEAU STRIPE') {
            throw new functions.https.HttpsError('invalid-argument', 'Phrase de confirmation invalide.');
        }

        const stripe = getStripe();
        const snap = await CONNECT_DOC_REF.get();
        const current = snap.exists ? snap.data() : {};
        const request = current.reconnectRequest || {};
        if (request.status !== 'requested' || !request.expiresAtMillis || Date.now() > Number(request.expiresAtMillis)) {
            throw new functions.https.HttpsError('failed-precondition', 'Demande de changement Stripe absente ou expiree.');
        }
        if (!current.activeAccountId || !current.pendingAccountId || current.activeAccountId === current.pendingAccountId) {
            throw new functions.https.HttpsError('failed-precondition', 'Aucun nouveau compte Stripe pending a activer.');
        }

        const account = await stripe.accounts.retrieve(current.pendingAccountId);
        if (account.charges_enabled !== true) {
            throw new functions.https.HttpsError('failed-precondition', 'Le nouveau compte Stripe ne peut pas encore encaisser.');
        }

        await CONNECT_DOC_REF.set({
            activeAccountId: current.pendingAccountId,
            pendingAccountId: admin.firestore.FieldValue.delete(),
            previousAccountIds: admin.firestore.FieldValue.arrayUnion(current.activeAccountId),
            status: getAccountStatus(account),
            chargesEnabled: account.charges_enabled === true,
            payoutsEnabled: account.payouts_enabled === true,
            detailsSubmitted: account.details_submitted === true,
            livemode: account.livemode === true,
            requirements: serializeRequirements(account),
            reconnectRequest: {
                ...request,
                status: 'confirmed',
                confirmedBy: {
                    uid: context.auth.uid,
                    email: context.auth.token.email || null
                },
                confirmedAt: admin.firestore.FieldValue.serverTimestamp()
            },
            connectedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            locked: true
        }, { merge: true });

        await auditConnect('reconnect_confirmed', context, {
            previousAccountIdMasked: maskAccountId(current.activeAccountId),
            newAccountIdMasked: maskAccountId(current.pendingAccountId)
        });

        const nextSnap = await CONNECT_DOC_REF.get();
        return {
            success: true,
            connect: publicConnectState(nextSnap.data() || {})
        };
    });

exports.getStripeConnectRouting = getStripeConnectRouting;
exports.retrieveAndPersistAccount = retrieveAndPersistAccount;
exports.maskAccountId = maskAccountId;
exports.CONNECT_DOC_REF = CONNECT_DOC_REF;
