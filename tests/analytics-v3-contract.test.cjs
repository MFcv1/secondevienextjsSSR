const test = require('node:test');
const assert = require('node:assert/strict');
const {
    addHll,
    buildContribution,
    contributionHash,
    diffContribution,
    estimateHll,
    mergeHll
} = require('../functions/src/analytics/v3Core');
const { durableTransitions } = require('../functions/src/analytics/v3BusinessFacts');

test('la taxonomie Next normalise les routes sans query string', async () => {
    const { classifyAnalyticsRoute, normalizeClientAction } = await import('../src/lib/analytics/v3Contract.js');
    assert.deepEqual(classifyAnalyticsRoute('/'), { routeKey: 'home', eventName: 'gallery_view' });
    assert.deepEqual(classifyAnalyticsRoute('/produit/commode-bleue'), { routeKey: 'product', eventName: 'product_view', entityId: 'commode-bleue' });
    assert.equal(classifyAnalyticsRoute('/admin'), null);
    assert.equal(normalizeClientAction('quote_email_opened'), 'quote_email_intent');
    assert.equal(normalizeClientAction('payment_paid_server'), null);
});

test('les lots hors ordre sont reconstruits par sequence', () => {
    const root = { activeDurationMs: 4200, measurementMode: 'product_analytics_consented' };
    const contribution = buildContribution([
        { seq: 3, eventName: 'cart_add', routeKey: 'product' },
        { seq: 1, eventName: 'gallery_view', routeKey: 'home' },
        { seq: 2, eventName: 'product_view', routeKey: 'product' }
    ], root);
    assert.equal(contribution.sessions, 1);
    assert.equal(contribution.pageViews, 2);
    assert.equal(contribution.transitions.home__product, 1);
    assert.equal(contribution.actions.cart_add, 1);
});

test('une reconciliation identique produit un delta nul', () => {
    const contribution = buildContribution([{ seq: 1, eventName: 'gallery_view', routeKey: 'home' }], { measurementMode: 'audience_minimized' });
    const delta = diffContribution(contribution, contribution);
    assert.equal(delta.sessions, 0);
    assert.deepEqual(delta.pages, {});
    assert.equal(contributionHash(contribution), contributionHash({ ...contribution }));
});

test('HyperLogLog fusionne les jours et reste dans la tolerance annoncee', () => {
    let left = null;
    let right = null;
    for (let index = 0; index < 5000; index += 1) {
        if (index < 3000) left = addHll(left, `visitor-${index}`);
        if (index >= 2000) right = addHll(right, `visitor-${index}`);
    }
    const estimate = estimateHll(mergeHll([left, right]));
    assert.ok(Math.abs(estimate - 5000) / 5000 < 0.05, `estimation recue: ${estimate}`);
});

test('les conversions durables ne viennent que des transitions serveur de commande', () => {
    assert.deepEqual(durableTransitions(null, { status: 'pending_payment' }).map((item) => item.type), ['order_created_server']);
    const paid = { status: 'paid', paymentMethod: 'stripe_elements', stripePaymentIntentId: 'pi_test', paidAt: { seconds: 1 } };
    assert.deepEqual(durableTransitions({ status: 'pending_payment' }, paid).map((item) => item.type), ['payment_paid_server']);
    assert.deepEqual(durableTransitions(paid, { ...paid, status: 'refunded', stripeRefundId: 're_test', refundedAt: { seconds: 2 } }).map((item) => item.type), ['refund_server']);
    assert.deepEqual(durableTransitions({ status: 'pending_payment' }, { status: 'paid' }).map((item) => item.type), []);
});
