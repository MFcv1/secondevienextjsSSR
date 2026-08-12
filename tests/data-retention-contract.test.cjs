'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
    AFFILIATE_RETENTION_DAYS,
    AUDIT_RETENTION_DAYS,
    DAY_MS,
    timestampAfterDays
} = require('../functions/helpers/retention');
const {
    createTargets,
    getDeletionReason,
    parseArgs,
    selectTargets
} = require('../scripts/purge-expired-firestore.cjs');

const ROOT_DIR = path.resolve(__dirname, '..');

function read(relativePath) {
    return fs.readFileSync(path.join(ROOT_DIR, relativePath), 'utf8');
}

test('la purge reste en dry-run sans consentement explicite', () => {
    assert.deepEqual(parseArgs([]), {
        commit: false,
        dryRun: true,
        pageSize: 400,
        project: null,
        collections: null
    });
    assert.equal(parseArgs(['--commit']).commit, true);
    assert.equal(parseArgs(['--commit']).dryRun, false);
    assert.equal(parseArgs(['--commit', '--dry-run']).dryRun, true);
});

test('les collections techniques ont une politique de retention bornee', () => {
    const targets = new Map(createTargets().map((target) => [target.name, target]));
    for (const collectionName of [
        'analytics_sessions',
        'analytics_item_daily',
        'sales_stats_daily',
        'sys_ratelimit',
        'sys_idempotency',
        'sys_audit_security',
        'sys_audit_stripe_connect',
        'sys_audit_quotes',
        'sys_audit_meta',
        'newsletter_reward_plays',
        'newsletter_rewards',
        'sys_meta_oauth_states',
        'sys_meta_asset_choices',
        'affiliate_clicks'
    ]) {
        assert.ok(targets.has(collectionName), `cible de retention absente: ${collectionName}`);
    }
    assert.equal(targets.get('sys_audit_security').retentionDays, AUDIT_RETENTION_DAYS);
    assert.equal(targets.get('sys_audit_stripe_connect').retentionDays, AUDIT_RETENTION_DAYS);
    assert.equal(targets.get('affiliate_clicks').retentionDays, AFFILIATE_RETENTION_DAYS);
    assert.deepEqual(
        selectTargets({ collections: ['sys_audit_security'] }).map((target) => target.name),
        ['sys_audit_security']
    );
});

test('une expiration explicite prime et les documents futurs sont conserves', () => {
    const now = Date.UTC(2026, 7, 12);
    const target = {
        retentionDays: AUDIT_RETENTION_DAYS,
        timestampFields: ['expireAt', 'expiresAt', 'createdAt']
    };

    assert.equal(
        getDeletionReason({ expireAt: now - 1 }, target, now)?.reason,
        'expireAt'
    );
    assert.equal(
        getDeletionReason({ expiresAt: { seconds: Math.floor((now - 1) / 1000) } }, target, now)?.reason,
        'expiresAt'
    );
    assert.equal(getDeletionReason({ expireAt: now + DAY_MS }, target, now), null);
    assert.equal(
        getDeletionReason({ createdAt: now - ((AUDIT_RETENTION_DAYS + 1) * DAY_MS) }, target, now)?.reason,
        'createdAt'
    );
});

test('le helper construit une date Firestore stable et refuse les durees invalides', () => {
    const now = Date.UTC(2026, 7, 12);
    assert.equal(timestampAfterDays(2, now).toMillis(), now + (2 * DAY_MS));
    assert.throws(() => timestampAfterDays(0, now), /RETENTION_DAYS_INVALID/);
    assert.throws(() => timestampAfterDays(2, 0), /RETENTION_NOW_INVALID/);
});

test('les producteurs sensibles ecrivent une expiration et ne journalisent pas les identifiants reseau bruts', () => {
    const securitySource = read('functions/helpers/security.js');
    const adminManagementSource = read('functions/src/auth/adminManagement.js');
    const connectSource = read('functions/src/commerce/stripeConnect.js');
    const metaSource = read('functions/src/integrations/meta.js');
    const quoteSource = read('functions/src/quotes/quoteRequests.js');
    const sessionSource = read('functions/src/analytics/sessions.js');

    assert.match(securitySource, /emailHash:\s*hash\(email\)/);
    assert.match(securitySource, /ipHash:\s*hash\(ip\)/);
    assert.match(securitySource, /userAgentHash:\s*hash\(userAgent\)/);
    assert.match(securitySource, /expireAt:\s*timestampAfterDays\(AUDIT_RETENTION_DAYS\)/);
    assert.doesNotMatch(securitySource, /\n\s*email:\s*normalizeEmail\(/);
    assert.doesNotMatch(securitySource, /\n\s*ip:\s*String\(/);

    const adminAuditCalls = [...adminManagementSource.matchAll(/writeSecurityAudit\([\s\S]*?\n\s*\}\);/g)]
        .map((match) => match[0])
        .join('\n');
    assert.match(adminAuditCalls, /emailHash:\s*hashAdminEmail\(email\)/);
    assert.match(adminAuditCalls, /targetEmailHash:\s*hashAdminEmail\(/);
    assert.doesNotMatch(adminAuditCalls, /\btargetEmail\s*:/);
    assert.doesNotMatch(adminAuditCalls, /\n\s*email,\s*\n/);

    assert.match(connectSource, /caller = getCallerAuditInfo\(context\)/);
    assert.match(connectSource, /expireAt:\s*timestampAfterDays\(AUDIT_RETENTION_DAYS\)/);
    assert.doesNotMatch(connectSource, /function getCaller\(/);

    assert.match(metaSource, /actorEmailHash:/);
    assert.doesNotMatch(metaSource, /\n\s*actorEmail:/);
    assert.match(metaSource, /expireAt:\s*timestampAfterDays\(AUDIT_RETENTION_DAYS\)/);
    assert.equal((quoteSource.match(/expireAt:\s*timestampAfterDays\(AUDIT_RETENTION_DAYS/g) || []).length, 3);
    assert.match(sessionSource, /expireAt:\s*timestampFromNow\(ANALYTICS_SESSION_RETENTION_DAYS\)/);
});
