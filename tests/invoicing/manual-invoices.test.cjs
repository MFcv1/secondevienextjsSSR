'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
    hashInvoice,
    invoiceNumber,
    normalizeInvoiceDraft
} = require('../../functions/src/invoicing/manualInvoiceDomain');
const {
    renderManualInvoicePdf
} = require('../../functions/src/invoicing/manualInvoicePdf');

const root = path.resolve(__dirname, '..', '..');
const source = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function draftFixture() {
    return normalizeInvoiceDraft({
        seller: {
            businessName: 'Seconde Vie',
            legalName: 'Anais Exemple EI',
            siren: '123456789',
            siret: '12345678901234',
            address1: '10 rue Exemple',
            postalCode: '13001',
            city: 'Marseille',
            country: 'France',
            email: 'atelier@example.test',
            vatMode: 'franchise'
        },
        customer: {
            customerType: 'individual',
            firstName: 'Camille',
            lastName: 'Martin',
            address1: '2 rue Client',
            postalCode: '75001',
            city: 'Paris',
            country: 'France',
            email: 'client@example.test'
        },
        lines: [{
            lineId: 'line_1',
            productId: 'meuble_1',
            name: 'Commode restaurée',
            description: 'Bois massif',
            quantity: 1,
            unitPriceCents: 42000
        }],
        issueDate: '2026-08-01',
        saleDate: '2026-08-01',
        dueDate: '2026-08-01',
        paymentTerms: 'Paiement comptant'
    });
}

test('factures manuelles: normalisation, montants entiers et numéro séquentiel', () => {
    const draft = draftFixture();
    assert.equal(draft.subtotalCents, 42000);
    assert.equal(draft.vatCents, 0);
    assert.equal(draft.totalCents, 42000);
    assert.equal(invoiceNumber('2026', 12), 'FAC-2026-000012');
    assert.equal(hashInvoice({ ...draft, number: 'FAC-2026-000012' }).length, 64);
});

test('factures manuelles: les coordonnées légales et client sont obligatoires', () => {
    assert.throws(
        () => normalizeInvoiceDraft({ ...draftFixture(), seller: { businessName: 'Seconde Vie' } }),
        /requis|SIREN/
    );
    assert.throws(
        () => normalizeInvoiceDraft({ ...draftFixture(), customer: { customerType: 'individual' } }),
        /Nom et prénom|adresse/
    );
});

test('factures manuelles: le PDF émis est déterministe et lisible', () => {
    const invoice = {
        ...draftFixture(),
        invoiceId: 'invoice_1',
        status: 'issued',
        number: 'FAC-2026-000012'
    };
    const first = renderManualInvoicePdf(invoice, { draft: false });
    const second = renderManualInvoicePdf(invoice, { draft: false });
    assert.equal(first.buffer.subarray(0, 5).toString(), '%PDF-');
    assert.equal(first.buffer.equals(second.buffer), true);
    assert.match(first.filename, /^Facture_FAC-2026-000012/);
    assert.ok(first.size < 2 * 1024 * 1024);
});

test('factures manuelles: UI lazy, callables et stockages privés restent alignés', () => {
    const admin = source('app/admin/AdminAppIsland.jsx');
    const functionsIndex = source('functions/index.js');
    const firestoreRules = source('firestore.rules');
    const storageRules = source('storage.rules');
    const ui = source('src/kit/admin/AdminInvoices.jsx');

    assert.match(admin, /React\.lazy\(\(\) => import\('\.\.\/\.\.\/src\/kit\/admin\/AdminInvoices'\)\)/);
    for (const callable of [
        'getManualInvoiceWorkspaceAdmin',
        'saveManualInvoiceDraftAdmin',
        'prepareManualInvoicePdfAdmin',
        'sendManualInvoiceAdmin'
    ]) {
        assert.match(functionsIndex, new RegExp(`exports\\.${callable}`));
        assert.match(ui, new RegExp(callable));
    }
    assert.match(firestoreRules, /match \/admin_invoices\/\{invoiceId\}/);
    assert.match(storageRules, /match \/admin-invoices\/\{allPaths=\*\*\}/);
    assert.match(storageRules, /topLevel != 'admin-invoices'/);
});
