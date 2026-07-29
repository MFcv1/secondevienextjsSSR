'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
    buildPaymentReceipt,
    buildRefundConfirmation
} = require('../../../functions/src/commerce/domain/commerceDocuments');
const {
    buildFinancialProjection
} = require('../../../functions/src/commerce/domain/financialProjection');
const {
    planFixtureCleanup
} = require('../../../functions/src/commerce/domain/fixtureCleanup');
const {
    evaluateCommerceHealth
} = require('../../../functions/src/commerce/domain/operationsHealth');
const {
    createOutboxWorker
} = require('../../../functions/src/commerce/domain/outboxWorker');

const repositoryRoot = path.resolve(__dirname, '..', '..', '..');

function fact(overrides = {}) {
    return {
        schemaVersion: 2,
        effectId: 'effect-capture-0001',
        orderId: 'order-gate7a-0001',
        type: 'capture',
        amountCents: 10000,
        currency: 'EUR',
        connectedAccountId: 'acct_gate7aready01',
        providerObjectId: 'pi_gate7a_0001',
        effectiveAt: '2026-07-28T12:00:00.000Z',
        commandId: 'command-gate7a-0001',
        ...overrides
    };
}

function order(overrides = {}) {
    return {
        id: 'order-gate7a-0001',
        schemaVersion: 2,
        userId: 'fixture_gate7a_uid',
        currency: 'EUR',
        payment: { status: 'succeeded' },
        fulfillmentSummary: { status: 'shipped' },
        ...overrides
    };
}

test('Gate 7A: captures et refunds succeeded construisent des montants absolus', () => {
    const projection = buildFinancialProjection([
        fact(),
        fact({
            effectId: 'effect-refund-0001',
            type: 'refund',
            amountCents: 2500,
            providerObjectId: 're_gate7a_0001',
            effectiveAt: '2026-07-29T09:00:00.000Z'
        }),
        fact({
            effectId: 'effect-pending-ignored',
            status: 'pending',
            amountCents: 9000
        })
    ]);
    assert.deepEqual(projection.currencies.EUR, {
        capturedCents: 10000,
        refundedCents: 2500,
        netCents: 7500
    });
    assert.equal(projection.factCount, 2);
    assert.equal(projection.divergences.length, 0);
});

test('Gate 7A: rebuild repete produit exactement le meme hash', () => {
    const facts = [
        fact(),
        fact({
            effectId: 'effect-refund-0002',
            type: 'refund',
            amountCents: 1000,
            providerObjectId: 're_gate7a_0002'
        })
    ];
    assert.equal(
        buildFinancialProjection(facts).projectionHash,
        buildFinancialProjection([...facts].reverse()).projectionHash
    );
});

test('Gate 7A: devises et dates effectives restent separees', () => {
    const projection = buildFinancialProjection([
        fact(),
        fact({
            effectId: 'effect-usd-0001',
            amountCents: 5000,
            currency: 'USD',
            providerObjectId: 'pi_gate7a_usd_0001',
            effectiveAt: '2026-07-29T01:00:00.000Z'
        })
    ]);
    assert.equal(projection.currencies.EUR.capturedCents, 10000);
    assert.equal(projection.currencies.USD.capturedCents, 5000);
    assert.ok(projection.days['2026-07-28:EUR']);
    assert.ok(projection.days['2026-07-29:USD']);
});

test('Gate 7A: un refund superieur au capture devient divergence', () => {
    const projection = buildFinancialProjection([
        fact(),
        fact({
            effectId: 'effect-refund-too-high',
            type: 'refund',
            amountCents: 12000,
            providerObjectId: 're_gate7a_too_high'
        })
    ]);
    assert.equal(projection.divergences[0].code, 'REFUND_EXCEEDS_CAPTURE');
});

test('Gate 7A: aucun recu de paiement avant encaissement durable', () => {
    assert.throws(
        () => buildPaymentReceipt({
            order: order({ payment: { status: 'processing' } }),
            facts: [fact()],
            issuedAt: '2026-07-28T13:00:00.000Z'
        }),
        /COMMERCE_PAYMENT_RECEIPT_NOT_ADMISSIBLE/
    );
});

test('Gate 7A: recu sandbox et confirmation refund sont distincts et non fiscaux', () => {
    const capture = fact();
    const refund = fact({
        effectId: 'effect-refund-document',
        type: 'refund',
        amountCents: 2500,
        providerObjectId: 're_gate7a_document'
    });
    const receipt = buildPaymentReceipt({
        order: order(),
        facts: [capture, refund],
        issuedAt: '2026-07-28T13:00:00.000Z'
    });
    const confirmation = buildRefundConfirmation({
        order: order(),
        facts: [capture, refund],
        refundId: refund.providerObjectId,
        issuedAt: '2026-07-29T13:00:00.000Z'
    });
    assert.equal(receipt.kind, 'sandbox_payment_receipt');
    assert.equal(confirmation.kind, 'sandbox_refund_confirmation');
    assert.equal(receipt.legalStatus, 'non_fiscal_sandbox');
    assert.equal(confirmation.fulfillmentPreserved, true);
    assert.notEqual(receipt.documentId, confirmation.documentId);
});

function workerClock() {
    let current = Date.parse('2026-07-28T12:00:00.000Z');
    return {
        now: () => new Date(current).toISOString(),
        nowMillis: () => current,
        advance: (milliseconds) => { current += milliseconds; }
    };
}

function outboxRepository(entry) {
    const state = { entry: { ...entry }, calls: [] };
    return {
        state,
        async claim(_id, lease) {
            state.entry = {
                ...state.entry,
                status: 'processing',
                leaseToken: lease.leaseToken,
                processingUntil: lease.nowMillis + lease.leaseMs,
                attemptCount: (state.entry.attemptCount || 0) + 1
            };
            return state.entry;
        },
        async markSent(_id, input) {
            state.calls.push({ type: 'sent', input });
            return input;
        },
        async markFailed(_id, input) {
            state.calls.push({ type: 'failed', input });
            return input;
        },
        async markDeliveryUnknown(_id, input) {
            state.calls.push({ type: 'delivery_unknown', input });
            return input;
        }
    };
}

function outboxEntry() {
    return {
        outboxId: 'outbox-gate7a-0001',
        template: 'order-paid',
        recipientRole: 'customer',
        payloadSnapshot: { orderId: 'order-gate7a-0001' },
        attemptCount: 0
    };
}

test('Gate 7A: panne avant envoi reste retryable failed', async () => {
    const repository = outboxRepository(outboxEntry());
    const worker = createOutboxWorker({
        repository,
        send: async () => {
            const error = new Error('provider unavailable');
            error.code = 'PROVIDER_UNAVAILABLE';
            throw error;
        },
        ids: { leaseToken: () => 'lease-gate7a-before' },
        clock: workerClock()
    });
    await assert.rejects(() => worker.process(outboxEntry().outboxId));
    assert.equal(repository.state.calls[0].type, 'failed');
});

test('Gate 7A: Gmail ambigu devient delivery_unknown sans retry automatique', async () => {
    const repository = outboxRepository(outboxEntry());
    const worker = createOutboxWorker({
        repository,
        send: async () => {
            const error = new Error('ack lost');
            error.code = 'GMAIL_DELIVERY_UNKNOWN';
            error.deliveryUnknown = true;
            throw error;
        },
        ids: { leaseToken: () => 'lease-gate7a-unknown' },
        clock: workerClock()
    });
    await assert.rejects(() => worker.process(outboxEntry().outboxId));
    assert.equal(repository.state.calls[0].type, 'delivery_unknown');
    assert.equal(repository.state.calls.some((call) => call.type === 'failed'), false);
});

test('Gate 7A: accuse provider marque sent avec idempotency key outbox', async () => {
    const repository = outboxRepository(outboxEntry());
    let idempotencyKey = null;
    const worker = createOutboxWorker({
        repository,
        send: async (input) => {
            idempotencyKey = input.idempotencyKey;
            return { providerMessageId: 'message-gate7a-0001' };
        },
        ids: { leaseToken: () => 'lease-gate7a-sent' },
        clock: workerClock()
    });
    await worker.process(outboxEntry().outboxId);
    assert.equal(idempotencyKey, outboxEntry().outboxId);
    assert.equal(repository.state.calls[0].type, 'sent');
});

test('Gate 7A: seuils exploitation produisent un stop explicite', () => {
    const health = evaluateCommerceHealth({
        deadLetterOutbox: 1,
        orphanPayments: 2
    });
    assert.equal(health.status, 'stop');
    assert.deepEqual(health.incidents.map((incident) => incident.code), [
        'deadLetterOutbox',
        'orphanPayments'
    ]);
});

test('Gate 7A: cleanup fixture dry-run ne supprime aucune preuve', () => {
    const runId = 'run_gate7a_cleanup_0001';
    const plan = planFixtureCleanup({
        runId,
        documents: [
            {
                collection: 'orders',
                id: 'order-proof',
                status: 'paid',
                testContext: { runId }
            },
            {
                collection: 'commerce_financial_facts',
                id: 'fact-proof',
                status: 'succeeded',
                testContext: { runId }
            },
            {
                collection: 'commerce_outbox',
                id: 'outbox-terminal',
                status: 'sent',
                testContext: { runId }
            }
        ]
    });
    assert.equal(plan.writes, 0);
    assert.equal(plan.deletes, 0);
    assert.equal(plan.actions.find((entry) => entry.collection === 'orders').action, 'preserve');
    assert.equal(
        plan.actions.find((entry) => entry.collection === 'commerce_financial_facts').action,
        'preserve'
    );
    assert.equal(
        plan.actions.find((entry) => entry.collection === 'commerce_outbox').action,
        'quarantine'
    );
    const commitPlan = planFixtureCleanup({
        runId,
        documents: [{
            collection: 'commerce_outbox',
            id: 'outbox-terminal',
            status: 'sent',
            testContext: { runId }
        }],
        dryRun: false
    });
    assert.equal(commitPlan.writes, 1);
    assert.equal(commitPlan.deletes, 0);
});

test('Gate 7A: manifeste et activation refusent toute cible non sandbox exacte', () => {
    for (const script of [
        'scripts/build-commerce-release-manifest.mjs',
        'scripts/activate-commerce-fixture.mjs'
    ]) {
        const result = spawnSync(process.execPath, [
            path.join(repositoryRoot, script),
            '--project=production-interdite',
            '--env=production'
        ], {
            cwd: repositoryRoot,
            encoding: 'utf8'
        });
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, /GATE7A_/);
    }
});

test('Gate 7A: le dashboard consomme les montants qualifies sans exposer les controles internes', () => {
    const dashboard = fs.readFileSync(
        path.join(repositoryRoot, 'src/kit/admin/AdminDashboard.jsx'),
        'utf8'
    );
    const email = fs.readFileSync(
        path.join(repositoryRoot, 'functions/src/email/orderEmails.js'),
        'utf8'
    );
    const stats = fs.readFileSync(
        path.join(repositoryRoot, 'functions/src/commerce/orderStats.js'),
        'utf8'
    );
    assert.match(dashboard, /getCommerceOperationsStatusAdmin/);
    assert.match(dashboard, /Bilan des ventes/);
    assert.match(dashboard, /Affichage des ventes/);
    assert.match(dashboard, /Évolution du chiffre d’affaires/);
    assert.match(dashboard, /<RevenueChart data={chartData}/);
    assert.match(dashboard, /\{ id: '1hour', label: '1h' \}/);
    assert.match(dashboard, /\{ id: '1day', label: '24h' \}/);
    assert.match(dashboard, /\{ id: 'max', label: 'Max' \}/);
    assert.doesNotMatch(dashboard, /paymentStatusLabel|'À jour'/);
    assert.match(dashboard, /aria-label="Période du graphique"/);
    assert.match(dashboard, /margin = \{ top: 48/);
    assert.doesNotMatch(dashboard, /-translate-y-\[65%\]/);
    assert.match(dashboard, /snap-x snap-mandatory/);
    assert.match(dashboard, /w-\[min\(72vw,190px\)\]/);
    assert.match(dashboard, /trackFraction = 0\.78/);
    assert.match(dashboard, /Répartition de \$\{total\} commandes/);
    assert.match(dashboard, /Panier moyen/);
    assert.doesNotMatch(dashboard, /Fraîcheur :|Faits :|Divergences :|Mode :/);
    assert.match(email, />= V2_EMAIL_OUTBOX_REQUIRED/);
    assert.match(stats, />= V2_STATS_PROJECTION_REQUIRED/);
});
