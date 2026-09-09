'use strict';

const functions = require('firebase-functions/v1');
const { createPasskeyRegistrationAuthorizer } = require('./passkeyHandlers.cjs');

async function authorizePasskeyRegistration(context, {
    readAccess = async (uid) => {
        const snapshot = await require('firebase-admin').firestore().doc(`sys_admin_access/${uid}`).get();
        return snapshot.exists ? snapshot.data() : null;
    },
    authorizeAdmin = (request) => require('../../helpers/security').checkActiveStrongAdmin(request)
} = {}) {
    return createPasskeyRegistrationAuthorizer({
        HttpsError: functions.https.HttpsError, readAccess, authorizeAdmin
    })(context);
}

module.exports = { authorizePasskeyRegistration };
