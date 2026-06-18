const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { normalizeFirestoreId } = require('../../helpers/security');
const { assertGuestCheckoutOtpVerified, normalizeGuestCheckoutEmail } = require('../auth/guestCheckoutOtp');

const db = admin.firestore();

function hasTrustedOrderReadAuth(context, orderData) {
    const uid = context.auth?.uid || '';
    const token = context.auth?.token || {};
    const tokenEmail = token.email ? normalizeGuestCheckoutEmail(token.email) : '';
    const orderEmail = orderData.userEmail ? normalizeGuestCheckoutEmail(orderData.userEmail) : '';
    const provider = token.firebase?.sign_in_provider || '';
    const identities = token.firebase?.identities || {};
    const hasTrustedProvider = provider === 'google.com' ||
        Array.isArray(identities['google.com']);
    const hasTrustedEmail = Boolean(tokenEmail) &&
        tokenEmail === orderEmail &&
        (token.email_verified === true || hasTrustedProvider);

    return Boolean(uid && uid === orderData.userId && hasTrustedEmail) || hasTrustedEmail;
}

exports.getOrderStatusClient = functions.https.onCall(async (data, context) => {
    const orderId = normalizeFirestoreId(data?.orderId, 'ID commande');
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
            orderData.userEmail !== verifiedGuestEmail
        ) {
            throw new functions.https.HttpsError('permission-denied', 'Cette commande ne vous appartient pas.');
        }
    }

    return {
        success: true,
        order: {
            id: orderSnap.id,
            status: orderData.status || null,
            paymentStatus: orderData.paymentStatus || null,
            stripePaymentIntentId: orderData.stripePaymentIntentId || null,
            total: orderData.total || 0,
            userEmail: orderData.userEmail || null
        }
    };
});
