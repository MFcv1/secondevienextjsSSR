'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { authorizePasskeyRegistration } = require('../functions/src/auth/passkeyRegistration');
const { getAuthAssurance } = require('../functions/helpers/security');

test('an OTP admin cannot manufacture an AAL2 session by enrolling a new passkey', async () => {
    const authorizeAdmin = async (context) => {
        if (getAuthAssurance(context).level !== 'aal2') throw new Error('strong-auth-required');
    };
    for (const token of [{ admin: true }, { superAdmin: true }, {}]) {
        const context = { auth: { uid: 'admin-one', token: { ...token, authMethod: 'email_otp', authAssurance: 'aal1' } } };
        await assert.rejects(authorizePasskeyRegistration(context, { readAccess: async () => ({ active: true }), authorizeAdmin }), /strong-auth-required/);
    }
    for (const token of [
        { firebase: { sign_in_provider: 'google.com' } },
        { authMethod: 'passkey', authAssurance: 'aal2', userVerified: true },
    ]) {
        await authorizePasskeyRegistration({ auth: { uid: 'admin-one', token: { ...token, admin: true } } }, { readAccess: async () => ({ active: true }), authorizeAdmin });
    }
});

test('ordinary customer enrollment remains available; revoked admin claims require the active registry guard', async () => {
    const weakCustomer = { auth: { uid: 'customer-one', token: { authMethod: 'email_otp' } } };
    await authorizePasskeyRegistration(weakCustomer, { readAccess: async () => null, authorizeAdmin: () => assert.fail('customer must not require an admin role') });
    await assert.rejects(authorizePasskeyRegistration({}, { readAccess: () => assert.fail('no read before Auth') }), { code: 'unauthenticated' });
    await assert.rejects(authorizePasskeyRegistration({ auth: { uid: 'removed-admin', token: { admin: true } } }, {
        readAccess: async () => ({ active: false }), authorizeAdmin: async () => { throw new Error('admin-access-inactive'); },
    }), /admin-access-inactive/);
    const source = fs.readFileSync(require.resolve('../functions/src/auth/passkeyHandlers.cjs'), 'utf8');
    for (const name of ['generatePasskeyRegistrationOptionsHandler', 'verifyPasskeyRegistrationHandler']) {
        const handler = source.slice(source.indexOf(`const ${name} =`));
        assert.ok(handler.indexOf('await authorizePasskeyRegistration(context)') < handler.indexOf('const uid = context.auth.uid'));
    }
});
