'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
    planNewsletterProjection
} = require('../functions/src/newsletter/newsletterProjectionDomain');

const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const timestamp = (seconds, nanoseconds = 0) => ({ seconds, nanoseconds });

test('le compteur newsletter applique ajout et retrait une seule fois', () => {
    const created = planNewsletterProjection({
        currentCount: 20,
        ledger: null,
        present: true,
        sourceUpdateTime: timestamp(10),
        eventId: 'create'
    });
    assert.deepEqual(created, { outcome: 'apply', activeCount: 21, delta: 1 });
    const ledger = { present: true, sourceUpdateTime: timestamp(10), eventId: 'create' };
    assert.equal(planNewsletterProjection({
        currentCount: 21,
        ledger,
        present: true,
        sourceUpdateTime: timestamp(10),
        eventId: 'create'
    }).outcome, 'noop');
    assert.deepEqual(planNewsletterProjection({
        currentCount: 21,
        ledger,
        present: false,
        sourceUpdateTime: timestamp(11),
        eventId: 'delete'
    }), { outcome: 'apply', activeCount: 20, delta: -1 });
    assert.equal(planNewsletterProjection({
        currentCount: 20,
        ledger: null,
        previousPresent: true,
        present: false,
        sourceUpdateTime: timestamp(12),
        eventId: 'delete-pre-baseline-contact'
    }).activeCount, 19);
});

test('un evenement plus ancien ne ressuscite pas un abonnement supprime', () => {
    const ledger = { present: false, sourceUpdateTime: timestamp(20), eventId: 'delete' };
    assert.equal(planNewsletterProjection({
        currentCount: 20,
        ledger,
        present: true,
        sourceUpdateTime: timestamp(19),
        eventId: 'late-create'
    }).outcome, 'noop');
    assert.throws(() => planNewsletterProjection({
        currentCount: 0,
        ledger: { present: true, sourceUpdateTime: timestamp(1), eventId: 'create' },
        present: false,
        sourceUpdateTime: timestamp(2),
        eventId: 'delete'
    }), /ADMIN_NEWSLETTER_SUMMARY_UNDERFLOW/);
});

test('la liste newsletter est paginee et le resume ne contient aucune PII', () => {
    const ui = read('src/kit/admin/AdminNewsletter.jsx');
    const projection = read('functions/src/newsletter/newsletterProjection.js');
    assert.match(ui, /NEWSLETTER_PAGE_SIZE/);
    assert.match(ui, /limit\(NEWSLETTER_PAGE_SIZE\)/);
    assert.match(ui, /admin_newsletter_summary/);
    assert.doesNotMatch(projection, /contactInfo|emailLower|firstName|lastName/);
});
