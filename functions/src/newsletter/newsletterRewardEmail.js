'use strict';

const {
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
            title: `Vous avez remporté ${percentage} %`,
            intro: 'Votre avantage est enregistré. Retrouvez-le à tout moment dans votre espace client avec la même adresse e-mail.',
            summaryHtml: renderSummaryGrid([
                { label: 'Réduction', value: `${percentage} %` },
                { label: 'Code', value: code },
                { label: 'Valable jusqu’au', value: expiryLabel }
            ]),
            contentHtml: `
                <div style="border:1px solid #ded7cc;border-radius:14px;padding:20px;text-align:center;">
                    <div style="color:#6f675e;font:700 10px/1.4 Arial,Helvetica,sans-serif;letter-spacing:1.2px;text-transform:uppercase;">Votre code personnel</div>
                    <div style="margin-top:9px;color:#1c1917;font:700 26px/1.2 Georgia,'Times New Roman',serif;letter-spacing:1.5px;">${escapeHtml(code)}</div>
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
