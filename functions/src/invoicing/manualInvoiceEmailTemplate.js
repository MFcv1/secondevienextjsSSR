'use strict';

const {
    EMAIL_COLORS,
    EMAIL_FONT_STACK,
    escapeHtml,
    renderCallout,
    renderEmailShell,
    renderSummaryGrid
} = require('../email/emailDesignSystem');

function formatInvoiceMoney(cents) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
        .format(Number(cents || 0) / 100);
}

function customerDisplayName(customer) {
    return customer.customerType === 'business'
        ? customer.businessName
        : [customer.firstName, customer.lastName].filter(Boolean).join(' ');
}

function invoiceEmail(invoice, recipient, senderEmail, artifact) {
    const name = customerDisplayName(invoice.customer);
    const contentHtml = `
        <div style="font-family:${EMAIL_FONT_STACK};font-size:14px;line-height:1.65;font-weight:400;color:${EMAIL_COLORS.muted};">
            ${invoice.lines.slice(0, 8).map((line) => `
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid ${EMAIL_COLORS.line};">
                    <tr>
                        <td style="padding:11px 0;color:${EMAIL_COLORS.muted};">${escapeHtml(`${line.quantity} × ${line.name}`)}</td>
                        <td align="right" style="padding:11px 0;color:${EMAIL_COLORS.text};font-weight:600;white-space:nowrap;">${escapeHtml(formatInvoiceMoney(line.totalCents))}</td>
                    </tr>
                </table>
            `).join('')}
        </div>`;
    return {
        from: `${invoice.seller.businessName} <${senderEmail}>`,
        to: recipient,
        replyTo: invoice.seller.email || senderEmail,
        subject: `Votre facture ${invoice.number} · ${invoice.seller.businessName}`,
        text: [
            `Bonjour ${name},`,
            `Votre facture ${invoice.number} d’un montant de ${formatInvoiceMoney(invoice.totalCents)} est jointe à cet e-mail.`,
            `Émise le ${invoice.issueDate}.`,
            `Pour toute question : ${invoice.seller.email}`
        ].join('\n'),
        html: renderEmailShell({
            preheader: `Facture ${invoice.number} — ${formatInvoiceMoney(invoice.totalCents)}`,
            eyebrow: 'Votre facture',
            title: 'Votre facture est prête.',
            intro: `Bonjour ${name}, vous trouverez votre facture en pièce jointe à cet e-mail.`,
            summaryHtml: renderSummaryGrid([
                { label: 'Facture', value: invoice.number },
                { label: 'Émission', value: invoice.issueDate },
                { label: 'Total', value: formatInvoiceMoney(invoice.totalCents) }
            ]),
            contentHtml,
            calloutHtml: renderCallout({
                title: 'Document joint au format PDF',
                body: 'Conservez ce document avec vos justificatifs. Répondez à cet e-mail si une information doit être vérifiée.',
                role: 'info',
                detail: artifact.filename
            }),
            footer: `Facture émise par ${invoice.seller.legalName} · SIREN ${invoice.seller.siren}.`
        }),
        attachments: [{
            filename: artifact.filename,
            content: artifact.buffer,
            contentType: artifact.contentType
        }]
    };
}

module.exports = {
    formatInvoiceMoney,
    invoiceEmail
};
