'use strict';

// Compatibility endpoint for old clients. The V2 checkout is the only order
// creation engine; retaining the old financial implementation here obscured
// this invariant even though the containment guard always rejected it.
const { regionalFunctions, logFunctionPerf, functions } = require('../../helpers/runtime');
const admin = require('firebase-admin');
const { STRIPE_SECRET_KEY, GMAIL_EMAIL, GMAIL_PASSWORD } = require('../../helpers/secrets');
const { assertLegacyOrderCreationBlocked } = require('./legacyContainment');

const db = admin.firestore();

async function createOrderHandler(data) {
    return assertLegacyOrderCreationBlocked({
        db,
        functions,
        paymentMethod: data?.orderData?.paymentMethod
    });
}

exports.createOrder = regionalFunctions()
    .runWith({ enforceAppCheck: true, secrets: [STRIPE_SECRET_KEY, GMAIL_EMAIL, GMAIL_PASSWORD] })
    .https.onCall(async (data) => {
        const startedAt = Date.now();
        try {
            return await createOrderHandler(data);
        } catch (error) {
            logFunctionPerf('createOrder', startedAt, {
                phase: 'error',
                paymentMethod: String(data?.orderData?.paymentMethod || '').slice(0, 40),
                code: error?.code || null
            });
            throw error;
        }
    });
exports.createOrderHandler = createOrderHandler;
