'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

const source = fs.readFileSync(require.resolve('../functions/src/auth/adminManagement.js'), 'utf8');
const functionSource = source.slice(source.indexOf('async function migrateAdminAccessIfMissing('), source.indexOf('async function migrateLegacyAdminAccess('));

test('legacy migration cannot overwrite a concurrent revocation or stale allowlist entry', async () => {
    for (const scenario of ['revoked', 'removed', 'email_changed', 'active']) {
        const writes = [];
        const uid = 'admin-audit';
        const entry = { uid, email: scenario === 'email_changed' ? 'different@example.test' : 'admin@example.test', status: 'active', role: 'admin' };
        const access = scenario === 'revoked' ? { active: false, role: 'admin' } : null;
        const db = {
            collection: name => ({ doc: id => `${name}/${id}` }), doc: path => path,
            runTransaction: callback => callback({
                get: async path => path.startsWith('sys_admin_access/')
                    ? { exists: Boolean(access), data: () => access }
                    : { exists: true, data: () => ({ users: scenario === 'removed' ? {} : { [uid]: entry } }) },
                set: (path, value) => writes.push({ path, value })
            })
        };
        const migrate = vm.runInNewContext(`${functionSource}; migrateAdminAccessIfMissing`, {
            db, ADMIN_ACCESS_COLLECTION: 'sys_admin_access', normalizeEmail: email => email.trim().toLowerCase(),
            buildActiveAccessRecord: input => ({ ...input, active: true })
        });
        const result = await migrate({ uid, email: 'admin@example.test', activatedByUid: 'owner-audit' });
        assert.equal(result.migrated, scenario === 'active');
        assert.equal(writes.length, scenario === 'active' ? 1 : 0);
        if (scenario === 'revoked') assert.equal(result.access.active, false);
    }
});
