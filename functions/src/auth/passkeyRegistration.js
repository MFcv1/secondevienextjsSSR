'use strict';

const functions = require('firebase-functions/v1');

async function authorizePasskeyRegistration(context, {
    readAccess = async (uid) => {
        const snapshot = await require('firebase-admin').firestore().doc(`sys_admin_access/${uid}`).get();
        return snapshot.exists ? snapshot.data() : null;
    },
    authorizeAdmin = (request) => require('../../helpers/security').checkActiveStrongAdmin(request)
} = {}) {
    if (!context.auth?.uid) {
        throw new functions.https.HttpsError('unauthenticated', 'Connexion requise.');
    }
    const token = context.auth.token || {};
    const access = await readAccess(context.auth.uid);
    // A weak admin session must not enroll its own new strong authenticator.
    // Read the registry as well: an existing token can predate the role grant.
    if (access?.active === true || token.admin === true || token.superAdmin === true) {
        await authorizeAdmin(context);
    }
}

module.exports = { authorizePasskeyRegistration };
