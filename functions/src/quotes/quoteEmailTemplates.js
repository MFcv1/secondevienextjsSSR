'use strict';

const {
    EMAIL_COLORS,
    EMAIL_FONT_STACK,
    escapeHtml,
    renderCallout,
    renderEmailShell,
    renderSummaryGrid
} = require('../email/emailDesignSystem');

function euroRange(estimate = {}) {
    const min = Number(estimate.minCents || 0) / 100;
    const max = Number(estimate.maxCents || 0) / 100;
    if (!min && !max) return 'À préciser';
    return `${min.toLocaleString('fr-FR')} € – ${max.toLocaleString('fr-FR')} €`;
}

function quoteReceiptEmail(quote, senderEmail) {
    const customer = quote.customer || {};
    const project = quote.project || {};
    const serviceLabels = Array.isArray(project.services)
        ? project.services.map((service) => service.label).filter(Boolean)
        : [];
    const summaryHtml = renderSummaryGrid([
        { label: 'Référence', value: quote.requestNumber || 'Demande reçue' },
        { label: 'Meuble', value: project.furnitureLabel || 'À préciser' },
        { label: 'Estimation', value: euroRange(project.indicativeEstimate) }
    ]);
    const contentHtml = `
        <div style="padding:18px 0;border-top:1px solid ${EMAIL_COLORS.line};border-bottom:1px solid ${EMAIL_COLORS.line};">
            <div style="color:${EMAIL_COLORS.muted};font-family:${EMAIL_FONT_STACK};font-size:11px;line-height:1.4;font-weight:600;letter-spacing:.3px;">
                Votre demande
            </div>
            <div style="margin-top:9px;color:${EMAIL_COLORS.text};font-family:${EMAIL_FONT_STACK};font-size:14px;line-height:1.6;font-weight:600;">
                ${escapeHtml(serviceLabels.length ? serviceLabels.join(' · ') : 'Diagnostic et prestations à préciser')}
            </div>
            ${project.description ? `
                <div style="margin-top:9px;color:${EMAIL_COLORS.muted};font-family:${EMAIL_FONT_STACK};font-size:13px;line-height:1.6;font-weight:400;">
                    ${escapeHtml(project.description)}
                </div>
            ` : ''}
        </div>
    `;

    return {
        from: `Seconde Vie <${senderEmail}>`,
        to: customer.email,
        replyTo: senderEmail,
        subject: `Votre demande ${quote.requestNumber || 'de devis'} a bien été reçue`,
        html: renderEmailShell({
            preheader: 'Votre demande de restauration est bien enregistrée.',
            eyebrow: 'Demande reçue',
            title: 'Votre demande a bien été reçue.',
            intro: `Bonjour ${customer.firstName || ''}, Anaïs va étudier votre meuble et les informations transmises. Vous recevrez une réponse personnalisée dès que le dossier aura été examiné.`,
            summaryHtml,
            contentHtml,
            calloutHtml: renderCallout({
                title: 'Aucune action nécessaire',
                body: 'Cette estimation reste indicative. Le devis définitif sera confirmé après étude de votre demande et de vos photos.',
                role: 'info',
                detail: 'Délai de réponse indicatif : 48 heures ouvrées.'
            }),
            footer: 'Confirmation automatique de réception. Ne transmettez jamais de données bancaires en réponse à ce message.'
        }),
        text: [
            `Bonjour ${customer.firstName || ''},`,
            '',
            `Votre demande ${quote.requestNumber || ''} a bien été reçue par Seconde Vie.`,
            `Meuble : ${project.furnitureLabel || 'À préciser'}`,
            `Estimation indicative : ${euroRange(project.indicativeEstimate)}`,
            serviceLabels.length ? `Prestations : ${serviceLabels.join(', ')}` : null,
            '',
            'Anaïs va étudier votre dossier et vous répondra de manière personnalisée.',
            'Aucune action n’est nécessaire de votre côté.',
            '',
            'Seconde Vie'
        ].filter((line) => line !== null).join('\n')
    };
}

module.exports = {
    euroRange,
    quoteReceiptEmail
};
