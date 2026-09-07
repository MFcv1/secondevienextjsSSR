'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const domain = require('../../functions/src/invoicing/manualInvoiceDomain');
const { jsPDF } = require('../../functions/node_modules/jspdf');

test('issued invoice reuses stored bytes across renderer upgrades and refuses a changed artifact digest', async () => {
    const source = fs.readFileSync(require.resolve('../../functions/src/invoicing/manualInvoices.js'), 'utf8');
    const functionSource = source.slice(source.indexOf('async function materializeIssuedInvoice('), source.indexOf('async function sendManualInvoiceHandler('));
    for (const scenario of ['existing', 'create', 'race', 'corrupt']) {
        const stored = Buffer.from('%PDF-' + 'stored-version'.repeat(10));
        let renderCalls = 0, saves = 0, creates = 0;
        const sha256 = crypto.createHash('sha256').update(stored).digest('hex');
        const file = {
            exists: async () => [scenario === 'existing' || scenario === 'corrupt'],
            save: async (_bytes, options) => { saves++; assert.equal(options.preconditionOpts.ifGenerationMatch, 0); if (scenario === 'race') throw Object.assign(new Error('precondition'), { code: 412 }); },
            getMetadata: async () => [{ size: String(stored.length), generation: '123', metadata: { sha256 } }],
            download: async () => [stored],
        };
        const materialize = vm.runInNewContext(`${functionSource}; materializeIssuedInvoice`, {
            crypto, Buffer, hashInvoice: () => 'hash', INVOICE_STORAGE_ROOT: 'admin-invoices/v1',
            renderManualInvoicePdf: () => { renderCalls++; return { buffer: stored, contentType: 'application/pdf', sha256 }; },
            admin: { storage: () => ({ bucket: () => ({ file: (_path, options) => { if (options) assert.equal(options.generation, '123'); return file; } }) }), firestore: { FieldValue: { serverTimestamp: () => 'now' } } },
            db: { runTransaction: callback => callback({
                get: async () => ({ exists: scenario === 'corrupt' || scenario === 'existing', data: () => ({ sha256: scenario === 'corrupt' ? 'wrong' : sha256 }) }),
                create: () => { creates++; },
            }) },
        });
        const invoke = () => materialize({ collection: () => ({ doc: () => 'artifact-ref' }) }, { invoiceId: 'invoice', number: 'FAC-2026-000001' });
        if (scenario === 'corrupt') await assert.rejects(invoke(), /INTEGRITY/);
        else assert.equal((await invoke()).buffer, stored);
        assert.equal(renderCalls, ['create', 'race'].includes(scenario) ? 1 : 0);
        assert.equal(saves, renderCalls);
        assert.equal(creates, ['create', 'race'].includes(scenario) ? 1 : 0);
    }
});

test('invoice PDF renders all 30 lines and long multiline notes within page bounds', () => {
    const source = fs.readFileSync(require.resolve('../../functions/src/invoicing/manualInvoicePdf.js'), 'utf8');
    const drawn = [];
    const loadedModule = { exports: {} };
    vm.runInNewContext(source, {
        Buffer, Date, module: loadedModule,
        require(name) {
            if (name === 'node:crypto') return crypto;
            if (name === './manualInvoiceDomain') return domain;
            if (name === 'jspdf') return { jsPDF: function(options) {
                const pdf = new jsPDF(options), text = pdf.text.bind(pdf);
                pdf.text = (value, x, y, ...args) => { drawn.push({ value, x, y, page: pdf.getCurrentPageInfo().pageNumber }); return text(value, x, y, ...args); };
                return pdf;
            } };
            throw new Error(name);
        },
    });
    const invoice = domain.normalizeInvoiceDraft({
        seller: { businessName: 'Atelier '.repeat(14).trim(), legalName: 'Legal '.repeat(26).trim(), siren: '123456789', address1: 'Adresse', postalCode: '13001', city: 'Marseille', email: 'atelier@example.test', vatMode: 'franchise' },
        customer: { customerType: 'individual', firstName: 'Client', lastName: 'Local', address1: 'Adresse', postalCode: '75001', city: 'Paris', email: 'client@example.test' },
        issueDate: '2026-09-07',
        lines: Array.from({ length: 30 }, (_, i) => ({ lineId: `line-${i}`, name: `ARTICLE_${i}`, description: 'Description\n'.repeat(45) + `FIN_DESCRIPTION_${i}`, quantity: 1, unitPriceCents: 1000 })),
        notes: 'Ligne de note\n'.repeat(130) + 'FIN_NOTES', paymentTerms: 'Conditions '.repeat(25) + 'FIN_CONDITIONS',
    });
    const artifact = loadedModule.exports.renderManualInvoicePdf({ ...invoice, number: 'FAC-2026-000001', status: 'issued' });
    assert.ok(artifact.size > 100);
    const texts = drawn.flatMap(entry => Array.isArray(entry.value) ? entry.value : [entry.value]).join('\n');
    for (let i = 0; i < 30; i++) { assert.ok(texts.includes(`ARTICLE_${i}`)); assert.ok(texts.includes(`FIN_DESCRIPTION_${i}`)); }
    assert.ok(texts.includes('FIN_NOTES'));
    assert.ok(texts.includes('FIN_CONDITIONS'));
    assert.ok(Math.max(...drawn.map(entry => entry.page)) > 5);
    assert.ok(drawn.every(entry => entry.y > 0 && entry.y <= 291), 'text anchors stay inside the A4 page');
});
