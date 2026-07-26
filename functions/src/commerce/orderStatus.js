const { functions, regionalFunctions, logFunctionPerf } = require('../../helpers/runtime');
const admin = require('firebase-admin');
const { normalizeFirestoreId } = require('../../helpers/security');
const { assertGuestCheckoutOtpVerified, normalizeGuestCheckoutEmail } = require('../auth/guestCheckoutOtp');
const { adaptOrderForRead } = require('./domain/orderState');

const db = admin.firestore();

function hasTrustedOrderReadAuth(context, orderData) {
    const uid = context.auth?.uid || '';
    const token = context.auth?.token || {};
    const tokenEmail = token.email ? normalizeGuestCheckoutEmail(token.email) : '';
    const rawOrderEmail = orderData.schemaVersion === 2
        ? orderData.customerSnapshot?.email
        : orderData.userEmail;
    const orderEmail = rawOrderEmail ? normalizeGuestCheckoutEmail(rawOrderEmail) : '';
    const provider = token.firebase?.sign_in_provider || '';
    const identities = token.firebase?.identities || {};
    const hasTrustedProvider = provider === 'google.com' ||
        Array.isArray(identities['google.com']);
    const hasTrustedEmail = Boolean(tokenEmail) &&
        tokenEmail === orderEmail &&
        (token.email_verified === true || hasTrustedProvider);

    return Boolean(uid && uid === orderData.userId && hasTrustedEmail) || hasTrustedEmail;
}

exports.getOrderStatusClient = regionalFunctions().runWith({ enforceAppCheck: true }).https.onCall(async (data, context) => {
    const startedAt = Date.now();
    const orderId = normalizeFirestoreId(data?.orderId, 'ID commande');

    try {
        const orderSnap = await db.collection('orders').doc(orderId).get();

        if (!orderSnap.exists) {
            throw new functions.https.HttpsError('not-found', 'Commande introuvable.');
        }

        const orderData = orderSnap.data();
        if (!hasTrustedOrderReadAuth(context, orderData)) {
            const verifiedGuestEmail = await assertGuestCheckoutOtpVerified(
                context.auth?.uid || null,
                data?.email,
                data?.checkoutOtpToken
            );
            if (
                orderData.checkoutAuthMethod !== 'guest_email_otp' ||
                (orderData.userEmail || orderData.customerSnapshot?.email) !== verifiedGuestEmail
            ) {
                throw new functions.https.HttpsError('permission-denied', 'Cette commande ne vous appartient pas.');
            }
        }

        logFunctionPerf('getOrderStatusClient', startedAt, { phase: 'success' });
        const readModel = adaptOrderForRead(orderData, orderSnap.id);
        return {
            success: true,
            order: {
                ...readModel,
                stripePaymentIntentId: orderData.payment?.paymentIntentId || orderData.stripePaymentIntentId || null,
                stripeConnectedAccountId: orderData.payment?.connectedAccountId || orderData.stripeConnectedAccountId || null,
                userEmail: readModel.userEmail || orderData.userEmail || null
            }
        };
    } catch (error) {
        logFunctionPerf('getOrderStatusClient', startedAt, {
            phase: 'error',
            code: error?.code || null
        });
        throw error;
    }
});
