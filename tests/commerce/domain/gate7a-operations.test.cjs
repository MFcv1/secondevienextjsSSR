'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const admin = require('../../../functions/node_modules/firebase-admin');
const {
    buildPaymentReceipt,
    buildRefundConfirmation
} = require('../../../functions/src/commerce/domain/commerceDocuments');
const {
    buildFinancialProjection
} = require('../../../functions/src/commerce/domain/financialProjection');
const {
    buildFinancialRollupDelta
} = require('../../../functions/src/commerce/domain/financialRollup');
const {
    planFixtureCleanup
} = require('../../../functions/src/commerce/domain/fixtureCleanup');
const {
    effectiveCommerceHealth,
    evaluateCommerceHealth,
    summarizePrimaryIncidents
} = require('../../../functions/src/commerce/domain/operationsHealth');
const {
    createOutboxWorker
} = require('../../../functions/src/commerce/domain/outboxWorker');

if (!admin.apps.length) {
    admin.initializeApp({ projectId: 'secondevienextjsssr' });
}
const {
    messageFor
} = require('../../../functions/src/commerce/v2Operations');

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

test('Gate 7A: une reversal Stripe compense le refund sans effacer les faits', () => {
    const projection = buildFinancialProjection([
        fact(),
        fact({
            effectId: 'effect-refund-reversed-0001',
            type: 'refund',
            amountCents: 2500,
            providerObjectId: 're_gate7a_reversed_0001',
            effectiveAt: '2026-07-29T09:00:00.000Z'
        }),
        fact({
            effectId: 'effect-refund-reversal-0001',
            type: 'refund_reversal',
            amountCents: 2500,
            providerObjectId: 're_gate7a_reversed_0001',
            effectiveAt: '2026-07-29T09:01:00.000Z'
        })
    ]);
    assert.deepEqual(projection.currencies.EUR, {
        capturedCents: 10000,
        refundedCents: 0,
        netCents: 10000
    });
    assert.equal(projection.factCount, 3);
});

test('Gate 7A: le rollup journalier applique des deltas signes et dates', () => {
    assert.deepEqual(buildFinancialRollupDelta(fact()), {
        dateKey: '2026-07-28',
        currency: 'EUR',
        capturedCents: 10000,
        refundedCents: 0,
        netCents: 10000,
        factCount: 1
    });
    assert.deepEqual(buildFinancialRollupDelta(fact({
        type: 'refund',
        amountCents: 2500,
        effectiveAt: '2026-07-29T23:59:00.000Z'
    })), {
        dateKey: '2026-07-29',
        currency: 'EUR',
        capturedCents: 0,
        refundedCents: 2500,
        netCents: -2500,
        factCount: 1
    });
    assert.deepEqual(buildFinancialRollupDelta(fact({
        type: 'refund_reversal',
        amountCents: 2500,
        effectiveAt: '2026-07-30T00:01:00.000Z'
    })), {
        dateKey: '2026-07-30',
        currency: 'EUR',
        capturedCents: 0,
        refundedCents: -2500,
        netCents: 2500,
        factCount: 1
    });
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

function premiumEmailOrder() {
    return {
        currency: 'EUR',
        customerSnapshot: { email: 'client@example.test' },
        shippingSnapshot: {
            fullName: 'Client Recette',
            line1: '12 rue de la Recette',
            postalCode: '13002',
            city: 'Marseille',
            country: 'FR',
            phone: '0612345678'
        },
        deliverySnapshot: {
            id: 'delivery-pickup',
            shippingCents: 0,
            policyVersion: 'sandbox_v2all_policy_20260729'
        },
        payment: { paymentIntentId: 'pi_sandbox_123' },
        amounts: { shippingCents: 0, totalCents: 12000 },
        items: [{
            titleSnapshot: 'Chevet <restaure>',
            quantity: 1,
            unitAmountCents: 12000
        }]
    };
}

test('Gate 7A: paiement client et notification admin sont deux messages premium distincts', () => {
    const entry = {
        template: 'order-paid',
        payloadSnapshot: {
            orderId: 'ord_cf6220c7-890d-4e78-bb6f-c049df51fb08',
            paymentIntentId: 'pi_sandbox_123',
            amountCents: 12000,
            currency: 'EUR'
        }
    };
    const message = messageFor(entry, premiumEmailOrder(), 'admin@example.test');
    const adminMessage = messageFor({
        ...entry,
        template: 'order-paid-admin'
    }, premiumEmailOrder(), 'admin@example.test');

    assert.equal(message.to, 'client@example.test');
    assert.equal(message.bcc, undefined);
    assert.equal(adminMessage.to, 'admin@example.test');
    assert.match(message.subject, /CMD-ORD_CF6220/);
    assert.match(message.text, /Retrait à l’atelier/);
    assert.match(message.html, /Voir ma commande/);
    assert.match(message.html, /Chevet &lt;restaure&gt;/);
    assert.doesNotMatch(message.html, /Chevet <restaure>/);
    assert.match(adminMessage.subject, /Nouvelle commande CMD-ORD_CF6220/);
    assert.match(adminMessage.html, /Ouvrir dans le back-office/);
    assert.match(adminMessage.html, /admin\?order_id=ord_cf6220c7-890d-4e78-bb6f-c049df51fb08/);
    assert.match(adminMessage.text, /pi_sandbox_123/);
    assert.match(adminMessage.text, /0612345678/);
});

test('Gate 7A: remboursement client et admin exposent Stripe sans restock implicite', () => {
    const entry = {
        template: 'order-refunded',
        payloadSnapshot: {
            orderId: 'ord_cf6220c7-890d-4e78-bb6f-c049df51fb08',
            refundId: 're_sandbox_123',
            amountCents: 12000,
            currency: 'EUR'
        }
    };
    const message = messageFor(entry, premiumEmailOrder(), 'admin@example.test');
    const adminMessage = messageFor({
        ...entry,
        template: 'order-refunded-admin'
    }, premiumEmailOrder(), 'admin@example.test');

    assert.equal(message.to, 'client@example.test');
    assert.equal(adminMessage.to, 'admin@example.test');
    assert.match(message.subject, /Remboursement CMD-ORD_CF6220 confirmé/);
    assert.match(message.text, /re_sandbox_123/);
    assert.match(message.html, /Crédit bancaire en cours/);
    assert.match(message.html, /Voir ma commande/);
    assert.match(adminMessage.text, /re_sandbox_123/);
    assert.match(adminMessage.html, /Stock inchangé/);
});

test('Gate 7A: chaque transition fulfillment et anomalie refund possede un rendu client', () => {
    for (const template of [
        'commerce-document-copy',
        'order-preparing',
        'order-ready-for-pickup',
        'order-picked-up',
        'order-shipped',
        'order-tracking-updated',
        'order-delivered',
        'order-refund-failed'
    ]) {
        const message = messageFor({
            template,
            payloadSnapshot: {
                orderId: 'ord_cf6220c7-890d-4e78-bb6f-c049df51fb08',
                amountCents: 12000,
                currency: 'EUR',
                carrierCode: 'chronopost',
                trackingNumber: 'TRACK-SANDBOX-123'
            }
        }, premiumEmailOrder(), 'admin@example.test');
        assert.equal(message.to, 'client@example.test');
        assert.match(message.html, /CMD-ORD_CF6220/);
        assert.match(
            message.html,
            template === 'commerce-document-copy'
                ? /Retrouver mes documents/
                : /Voir ma commande/
        );
        assert.match(message.text, /120,00/);
    }
    const failedAdmin = messageFor({
        template: 'order-refund-failed-admin',
        payloadSnapshot: {
            orderId: 'ord_cf6220c7-890d-4e78-bb6f-c049df51fb08',
            amountCents: 12000,
            currency: 'EUR'
        }
    }, premiumEmailOrder(), 'admin@example.test');
    assert.equal(failedAdmin.to, 'admin@example.test');
    assert.match(failedAdmin.html, /Ne pas relancer à l’aveugle/);
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

test('Gate 7A: un incident financier primaire interdit le faux vert', () => {
    const health = evaluateCommerceHealth({
        primaryIncidents: [{ code: 'terminal_refund_conflict', status: 'open' }]
    }, { evaluatedAt: '2026-08-15T12:00:00.000Z' });
    assert.equal(health.status, 'stop');
    assert.equal(health.primaryOpenIncidentCount, 1);
    assert.deepEqual(health.incidentHistogram, { terminal_refund_conflict: 1 });
    assert.equal(health.truncated, false);
    assert.equal(health.validUntil, '2026-08-15T13:30:00.000Z');
});

test('Gate 7A: incidents derives exclus, code inconnu et troncature fail-closed', () => {
    const summary = summarizePrimaryIncidents([
        { code: 'operations_dueInbox', source: 'commerce_operations_reconciler' },
        { code: 'future_financial_code', status: 'open' }
    ], { truncated: true });
    assert.equal(summary.count, 1);
    assert.deepEqual(summary.histogram, { future_financial_code: 1 });
    const health = evaluateCommerceHealth({
        primaryIncidents: [{ code: 'future_financial_code', status: 'open' }],
        primaryIncidentsTruncated: true
    }, { evaluatedAt: '2026-08-15T12:00:00.000Z' });
    assert.equal(health.status, 'stop');
    assert.equal(health.truncated, true);
});

test('Gate 7A: une sante absente ou stale est effectivement stop', () => {
    assert.deepEqual(effectiveCommerceHealth(null, { nowMillis: 1 }), {
        storedStatus: 'unknown',
        effectiveStatus: 'stop',
        stale: true,
        ageSeconds: null
    });
    const health = evaluateCommerceHealth({}, { evaluatedAt: '2026-08-15T12:00:00.000Z' });
    assert.equal(health.status, 'healthy');
    assert.equal(effectiveCommerceHealth(health, {
        nowMillis: Date.parse('2026-08-15T13:31:00.000Z')
    }).effectiveStatus, 'stop');
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
    const adminIsland = fs.readFileSync(
        path.join(repositoryRoot, 'app/admin/AdminAppIsland.jsx'),
        'utf8'
    );
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
    const operations = fs.readFileSync(
        path.join(repositoryRoot, 'functions/src/commerce/v2Operations.js'),
        'utf8'
    );
    assert.match(adminIsland, /getCommerceOperationsStatusAdmin/);
    assert.match(adminIsland, /commerceStatus=\{commerceStatus\}/);
    assert.match(dashboard, /commerceStatus\.data\?\.operations\?\.projection/);
    assert.match(dashboard, /commerceStatus\.data\?\.financialSummary\?\.currencies\?\.EUR/);
    assert.match(dashboard, /commerceStatus\.data\?\.orderSummary/);
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
    assert.match(dashboard, /Santé commerce/);
    assert.match(dashboard, /Dernière évaluation/);
    assert.match(dashboard, /primaryOpenIncidentCount/);
    assert.match(dashboard, /incidentHistogram/);
    assert.match(email, />= V2_EMAIL_OUTBOX_REQUIRED/);
    assert.match(stats, />= V2_STATS_PROJECTION_REQUIRED/);
    assert.match(operations, /buildAdminOrderSummary/);
    assert.match(operations, /commerce_financial_totals\/EUR/);
    assert.match(operations, /commerce_financial_daily/);
    assert.match(operations, /\.pubsub\.schedule\('every 60 minutes'\)/);
    assert.match(operations, /orderSummary,/);
    assert.match(operations, /financialSummary,/);
    assert.match(operations, /financialDaily,/);
});
