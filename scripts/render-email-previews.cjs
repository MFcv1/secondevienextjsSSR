'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('@playwright/test');
const sharp = require('sharp');
const {
    renderCommerceEmail
} = require('../functions/src/email/commerceEmailTemplates');
const {
    renderOtpEmail
} = require('../functions/src/email/otpEmailTemplates');

const OUTPUT_DIR = path.resolve(__dirname, '../logs/email-previews');
const SITE_URL = 'https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app';

const order = {
    id: 'ord_demo_20260730',
    currency: 'EUR',
    userEmail: 'camille.martin@example.com',
    customerSnapshot: {
        email: 'camille.martin@example.com'
    },
    shippingSnapshot: {
        fullName: 'Camille Martin',
        line1: '28 rue Sainte',
        line2: 'Bâtiment B',
        postalCode: '13001',
        city: 'Marseille',
        country: 'France',
        phone: '+33 6 12 34 56 78'
    },
    deliverySnapshot: {
        id: 'delivery-carrier',
        label: 'Transporteur spécialisé'
    },
    amounts: {
        subtotalCents: 108000,
        shippingCents: 12000,
        totalCents: 120000
    },
    payment: {
        paymentIntentId: 'pi_3PremiumDemoSecondeVie'
    },
    fulfillmentSummary: {
        trackingNumber: 'SV-2026-MRS-0042'
    },
    items: [
        {
            titleSnapshot: 'Enfilade scandinave en teck',
            quantity: 1,
            unitAmountCents: 108000
        }
    ]
};

const payload = {
    orderId: order.id,
    amountCents: 120000,
    currency: 'EUR',
    paymentIntentId: order.payment.paymentIntentId,
    refundId: 're_3PremiumDemoRefund',
    trackingNumber: order.fulfillmentSummary.trackingNumber,
    documentKind: 'sandbox_payment_receipt'
};

const previews = [
    {
        slug: '01-otp-connexion',
        label: 'OTP · Connexion',
        render: () => renderOtpEmail({ variant: 'login', code: '824 109'.replace(' ', ''), siteUrl: SITE_URL })
    },
    {
        slug: '02-otp-validation-commande',
        label: 'OTP · Validation commande',
        render: () => renderOtpEmail({ variant: 'checkout', code: '391 672'.replace(' ', ''), siteUrl: SITE_URL })
    },
    ...[
        ['03-commande-payee-client', 'Commande payée · Client', 'order-paid'],
        ['04-commande-payee-admin', 'Commande payée · Admin', 'order-paid-admin'],
        ['05-commande-en-preparation', 'Commande en préparation · Client', 'order-preparing'],
        ['06-commande-prete-au-retrait', 'Prête au retrait · Client', 'order-ready-for-pickup'],
        ['07-commande-retiree', 'Commande retirée · Client', 'order-picked-up'],
        ['08-commande-expediee', 'Commande expédiée · Client', 'order-shipped'],
        ['09-commande-livree', 'Commande livrée · Client', 'order-delivered'],
        ['10-remboursement-confirme-client', 'Remboursement confirmé · Client', 'order-refunded'],
        ['11-remboursement-confirme-admin', 'Remboursement confirmé · Admin', 'order-refunded-admin'],
        ['12-remboursement-echec-client', 'Anomalie remboursement · Client', 'order-refund-failed'],
        ['13-remboursement-echec-admin', 'Anomalie remboursement · Admin', 'order-refund-failed-admin'],
        ['14-suivi-corrige', 'Suivi corrigé · Client', 'order-tracking-updated'],
        ['15-copie-document', 'Copie document · Client', 'commerce-document-copy']
    ].map(([slug, label, template]) => ({
        slug,
        label,
        render: () => renderCommerceEmail({
            template,
            order,
            payload: {
                ...payload,
                refundId: template.includes('refund') ? payload.refundId : null,
                documentKind: template === 'commerce-document-copy'
                    ? payload.documentKind
                    : null
            },
            senderEmail: 'admin@secondevie.example',
            siteUrl: SITE_URL
        })
    }))
];

async function main() {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
        viewport: { width: 760, height: 900 },
        deviceScaleFactor: 1
    });
    const manifest = [];

    for (const preview of previews) {
        const message = preview.render();
        const htmlPath = path.join(OUTPUT_DIR, `${preview.slug}.html`);
        const imagePath = path.join(OUTPUT_DIR, `${preview.slug}.png`);
        await fs.writeFile(htmlPath, message.html, 'utf8');
        await page.setContent(message.html, { waitUntil: 'load' });
        await page.screenshot({ path: imagePath, fullPage: true });
        manifest.push({
            label: preview.label,
            subject: message.subject,
            htmlPath,
            imagePath
        });
    }

    await browser.close();
    const thumbnailWidth = 230;
    const columnGap = 18;
    const rowGap = 22;
    const columns = 3;
    const rowHeight = 350;
    const contactWidth = (thumbnailWidth * columns) + (columnGap * (columns + 1));
    const rows = Math.ceil(manifest.length / columns);
    const contactHeight = (rowHeight * rows) + (rowGap * (rows + 1));
    const composites = [];

    for (let index = 0; index < manifest.length; index += 1) {
        const thumbnail = await sharp(manifest[index].imagePath)
            .resize({ width: thumbnailWidth })
            .png()
            .toBuffer();
        const metadata = await sharp(thumbnail).metadata();
        composites.push({
            input: thumbnail,
            left: columnGap + ((index % columns) * (thumbnailWidth + columnGap)),
            top: rowGap + (Math.floor(index / columns) * (rowHeight + rowGap))
                + Math.max(0, Math.floor((rowHeight - Number(metadata.height || 0)) / 2))
        });
    }

    await sharp({
        create: {
            width: contactWidth,
            height: contactHeight,
            channels: 3,
            background: '#e9e4dc'
        }
    })
        .composite(composites)
        .png()
        .toFile(path.join(OUTPUT_DIR, '00-galerie-complete.png'));
    await fs.writeFile(
        path.join(OUTPUT_DIR, 'manifest.json'),
        `${JSON.stringify(manifest, null, 2)}\n`,
        'utf8'
    );
    process.stdout.write(`${manifest.length} aperçus générés dans ${OUTPUT_DIR}\n`);
}

main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
});
