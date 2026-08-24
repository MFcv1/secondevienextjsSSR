'use strict';

const {
    EMAIL_COLORS,
    EMAIL_FONT_STACK,
    escapeHtml,
    renderCallout,
    renderEmailShell,
    renderSummaryGrid
} = require('../email/emailDesignSystem');

function newsletterRewardEmail(reward, senderEmail, siteUrl) {
    const code = String(reward.code || '');
    const percentage = Number(reward.percentage || 0);
    const accountUrl = `${String(siteUrl || '').replace(/\/$/, '')}/mes-commandes#avantages`;
    const expiry = reward.expiresAt?.toDate?.() || new Date(reward.expiresAt || 0);
    const expiryLabel = Number.isNaN(expiry.getTime())
        ? '30 jours'
        : expiry.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' });

    return {
        from: `Seconde Vie <${senderEmail}>`,
        to: reward.emailLower,
        replyTo: senderEmail,
        subject: `Votre code Seconde Vie de ${percentage} %`,
        html: renderEmailShell({
            preheader: `Votre code ${code} est prêt.`,
            eyebrow: 'Avantage newsletter',
            title: 'Votre avantage est prêt.',
            intro: `Votre réduction de ${percentage} % est enregistrée. Retrouvez-la à tout moment dans votre espace client avec la même adresse e-mail.`,
            summaryHtml: renderSummaryGrid([
                { label: 'Réduction', value: `${percentage} %` },
                { label: 'Code', value: code },
                { label: 'Valable jusqu’au', value: expiryLabel }
            ]),
            contentHtml: `
                <div style="padding:22px 0;border-top:1px solid ${EMAIL_COLORS.line};border-bottom:1px solid ${EMAIL_COLORS.line};text-align:center;">
                    <div style="color:${EMAIL_COLORS.muted};font-family:${EMAIL_FONT_STACK};font-size:13px;line-height:1.4;font-weight:400;">Votre code personnel</div>
                    <div style="margin-top:10px;color:${EMAIL_COLORS.text};font-family:${EMAIL_FONT_STACK};font-size:26px;line-height:1.2;font-weight:600;letter-spacing:1px;">${escapeHtml(code)}</div>
                </div>
            `,
            calloutHtml: renderCallout({
                title: 'Gardez ce code sous la main',
                body: 'Il est associé à cette adresse e-mail. Anaïs pourra le vérifier lors de la préparation de votre commande.',
                role: 'success',
                detail: 'Une seule utilisation par commande. Conditions finales confirmées par l’atelier.'
            }),
            actionLabel: 'Voir mes avantages',
            actionUrl: accountUrl,
            footer: 'Vous recevez ce message après votre inscription à la newsletter Seconde Vie. Vous pouvez demander votre désinscription à tout moment.'
        }),
        text: [
            `Vous avez remporté ${percentage} % chez Seconde Vie.`,
            '',
            `Votre code : ${code}`,
            `Valable jusqu’au : ${expiryLabel}`,
            '',
            `Retrouvez-le dans votre espace client : ${accountUrl}`,
            '',
            'Ce code est associé à cette adresse e-mail et sera vérifié par l’atelier.',
            'Seconde Vie'
        ].join('\n')
    };
}

module.exports = { newsletterRewardEmail };
