'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
    materializeCommerceDocumentArtifact,
    renderCommerceDocumentPdf
} = require('../../../functions/src/commerce/domain/commerceDocumentArtifact');
const {
    EMAIL_DEDUPE_MS,
    createDeliveryIntent,
    maskEmail
} = require('../../../functions/src/commerce/v2DocumentDelivery');

const repositoryRoot = path.resolve(__dirname, '..', '..', '..');
const source = (relativePath) => fs.readFileSync(
    path.join(repositoryRoot, relativePath),
    'utf8'
);

function fixtures() {
    const order = {
        schemaVersion: 2,
        id: 'order-document-0001',
        userId: 'uid-document-owner',
        userEmail: 'client@example.test',
        currency: 'EUR',
        customerSnapshot: { fullName: 'Client Recette' },
        items: [{
            titleSnapshot: 'Commode restaurée',
            quantity: 1,
            unitAmountCents: 14900
        }]
    };
    const document = {
        schemaVersion: 2,
        documentId: 'd'.repeat(64),
        orderId: order.id,
        ownerUid: order.userId,
        kind: 'sandbox_payment_receipt',
        legalStatus: 'non_fiscal_sandbox',
        currency: 'EUR',
        capturedCents: 14900,
        issuedAt: '2026-07-31T10:00:00.000Z',
        contentHash: 'c'.repeat(64)
    };
    return { order, document };
}

test('document delivery: le PDF serveur est déterministe et explicitement non fiscal', () => {
    const input = fixtures();
    const first = renderCommerceDocumentPdf(input);
    const second = renderCommerceDocumentPdf(input);

    assert.equal(first.buffer.subarray(0, 5).toString(), '%PDF-');
    assert.equal(first.sha256, second.sha256);
    assert.equal(first.buffer.equals(second.buffer), true);
    assert.match(first.filename, /^Recu_paiement_CMD-/);
    assert.equal(first.contentType, 'application/pdf');
    assert.ok(first.size < 2 * 1024 * 1024);
});

test('document delivery: le stockage immuable est réutilisé sans réécriture', async () => {
    const input = fixtures();
    const files = new Map();
    let artifactRecord = null;
    let saveCount = 0;
    const bucket = {
        file(storagePath) {
            return {
                exists: async () => [files.has(storagePath)],
                save: async (buffer) => {
                    saveCount += 1;
                    files.set(storagePath, Buffer.from(buffer));
                },
                download: async () => [Buffer.from(files.get(storagePath))]
            };
        }
    };
    const artifactRef = {
        get: async () => ({
            exists: Boolean(artifactRecord),
            data: () => artifactRecord
        }),
        create: async (record) => {
            if (artifactRecord) {
                const error = new Error('already exists');
                error.code = 6;
                throw error;
            }
            artifactRecord = record;
        }
    };

    const first = await materializeCommerceDocumentArtifact({
        bucket,
        artifactRef,
        ...input,
        now: () => '2026-07-31T10:01:00.000Z'
    });
    const second = await materializeCommerceDocumentArtifact({
        bucket,
        artifactRef,
        ...input,
        now: () => '2026-07-31T10:02:00.000Z'
    });

    assert.equal(saveCount, 1);
    assert.equal(first.sha256, second.sha256);
    assert.equal(first.buffer.equals(second.buffer), true);
    assert.match(artifactRecord.storagePath, /^commerce-documents\/v2\//);
    assert.equal(artifactRecord.sourceContentHash, input.document.contentHash);
});

test('document delivery: l’email est dédupliqué par fenêtre sans exposer le destinataire', () => {
    const { order, document } = fixtures();
    const recipient = 'client@example.test';
    const start = Date.parse('2026-07-31T10:00:00.000Z');
    const first = createDeliveryIntent({ order, document, recipient, nowMillis: start });
    const duplicate = createDeliveryIntent({
        order,
        document,
        recipient,
        nowMillis: start + EMAIL_DEDUPE_MS - 1
    });
    const nextWindow = createDeliveryIntent({
        order,
        document,
        recipient,
        nowMillis: start + EMAIL_DEDUPE_MS
    });

    assert.equal(first.outboxId, duplicate.outboxId);
    assert.notEqual(first.outboxId, nextWindow.outboxId);
    assert.equal(first.template, 'commerce-document-copy');
    assert.doesNotMatch(JSON.stringify(first), /client@example\.test/);
    assert.equal(maskEmail(recipient), 'cl••••@e•••••.test');
});

test('document delivery: l’interface garde ouvrir, enregistrer, partager et le bon langage d’état', () => {
    const modal = source('src/kit/commerce/CommerceDocumentModal.jsx');
    const orders = source('src/kit/commerce/MyOrdersView.jsx');
    const rules = source('storage.rules');

    assert.match(modal, /Ouvrir le PDF/);
    assert.match(modal, /Enregistrer/);
    assert.match(modal, /navigator\.canShare/);
    assert.match(modal, /Téléchargement lancé/);
    assert.match(modal, /role="dialog"/);
    assert.match(modal, /aria-live/);
    assert.match(orders, /CommerceDocumentModal/);
    assert.doesNotMatch(orders, /generateCommerceDocument/);
    assert.match(rules, /topLevel != 'commerce-documents'/);
    assert.match(rules, /match \/commerce-documents\/\{allPaths=\*\*\}/);
});
