'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const { renderCommerceEmail } = require('../functions/src/email/commerceEmailTemplates');
const { renderOtpEmail } = require('../functions/src/email/otpEmailTemplates');
const { invoiceEmail } = require('../functions/src/invoicing/manualInvoiceEmailTemplate');
const { newsletterRewardEmail } = require('../functions/src/newsletter/newsletterRewardEmail');
const { quoteReceiptEmail } = require('../functions/src/quotes/quoteEmailTemplates');

const siteUrl = 'https://sandbox.example.test';
const senderEmail = 'admin@example.test';
const order = {
    id: 'ord_email_design',
    currency: 'EUR',
    userEmail: 'camille@example.test',
    customerSnapshot: { email: 'camille@example.test' },
    shippingSnapshot: {
        fullName: 'Camille Martin',
        line1: '28 rue Sainte',
        postalCode: '13001',
        city: 'Marseille',
        country: 'France'
    },
    deliverySnapshot: { id: 'delivery-carrier', label: 'Transporteur spécialisé' },
    amounts: { shippingCents: 12000, totalCents: 120000 },
    payment: { paymentIntentId: 'pi_design_test' },
    fulfillmentSummary: { trackingNumber: 'SV-TEST-42', custody: 'merchant' },
    items: [{ titleSnapshot: 'Enfilade scandinave', quantity: 1, unitAmountCents: 108000 }]
};
const payload = {
    orderId: order.id,
    amountCents: 120000,
    currency: 'EUR',
    paymentIntentId: 'pi_design_test',
    refundId: 're_design_test',
    trackingNumber: 'SV-TEST-42',
    reason: 'changed_mind',
    documentKind: 'sandbox_payment_receipt'
};

function canonicalMessages() {
    const commerceTemplates = [
        'order-paid',
        'order-paid-admin',
        'order-preparing',
        'order-ready-for-pickup',
        'order-picked-up',
        'order-shipped',
        'order-tracking-updated',
        'order-delivered',
        'order-refunded',
        'order-refunded-admin',
        'order-refund-failed',
        'order-refund-failed-admin',
        'commerce-document-copy',
        'customer-return-requested-admin'
    ];
    return [
        renderOtpEmail({ variant: 'login', code: '824109', siteUrl }),
        renderOtpEmail({ variant: 'checkout', code: '391672', siteUrl }),
        ...commerceTemplates.map((template) => renderCommerceEmail({
            template,
            order,
            payload,
            senderEmail,
            siteUrl
        })),
        quoteReceiptEmail({
            requestNumber: 'DEV-20260823-A7C4F2',
            customer: { firstName: 'Camille', email: 'camille@example.test' },
            project: {
                furnitureLabel: 'Enfilade scandinave',
                services: [{ label: 'Finition mate' }],
                indicativeEstimate: { minCents: 68000, maxCents: 94000 }
            }
        }, senderEmail),
        newsletterRewardEmail({
            code: 'SV10-A7C4F2',
            percentage: 10,
            emailLower: 'camille@example.test',
            expiresAt: '2026-09-22T22:00:00.000Z'
        }, senderEmail, siteUrl),
        invoiceEmail({
            number: 'FV-2026-0042',
            issueDate: '23 août 2026',
            totalCents: 120000,
            customer: { customerType: 'individual', firstName: 'Camille', lastName: 'Martin' },
            seller: {
                businessName: 'Seconde Vie',
                legalName: 'Seconde Vie',
                email: senderEmail,
                siren: '000 000 000'
            },
            lines: [{ quantity: 1, name: 'Enfilade scandinave', totalCents: 120000 }]
        }, 'camille@example.test', senderEmail, {
            filename: 'facture-FV-2026-0042.pdf',
            buffer: Buffer.from('test'),
            contentType: 'application/pdf'
        })
    ];
}

test('les 19 e-mails canoniques partagent le shell systeme epure', () => {
    const messages = canonicalMessages();
    assert.equal(messages.length, 19);
    for (const message of messages) {
        assert.match(message.html, /<!doctype html>/i);
        assert.match(message.html, /<html lang="fr">/);
        assert.match(message.html, /font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif/);
        assert.match(message.html, /background:#ffffff/);
        assert.match(message.html, /max-width:580px/);
        assert.match(message.html, /Seconde Vie/);
        assert.doesNotMatch(message.html, /Georgia|Times New Roman|background:#1c1917|background:#f5f5f7|box-shadow|sv-card|border-radius:(?:18|28|999)px/);
        assert.ok(message.text?.length > 20);
    }
});

test('les e-mails legacy et diagnostic utilisent aussi le shell commun', () => {
    const source = fs.readFileSync(
        path.resolve(__dirname, '../functions/src/email/orderEmails.js'),
        'utf8'
    );
    assert.match(source, /renderEmailShell/);
    assert.match(source, /renderSummaryGrid/);
    assert.match(source, /renderCallout/);
    assert.doesNotMatch(source, /🆕|📦|✨|font-family:\s*(?:Arial|'Georgia'|sans-serif)/);
});
