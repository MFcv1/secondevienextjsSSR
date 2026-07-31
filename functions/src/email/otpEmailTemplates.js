'use strict';

const {
    EMAIL_COLORS,
    escapeHtml,
    renderCallout,
    renderEmailShell
} = require('./emailDesignSystem');

const OTP_VARIANTS = Object.freeze({
    login: {
        subject: 'Votre code de connexion · Seconde Vie',
        eyebrow: 'Connexion sécurisée',
        title: 'Ouvrez votre espace.',
        intro: 'Utilisez ce code à six chiffres pour vous connecter à votre espace client.',
        purpose: 'Code de connexion'
    },
    checkout: {
        subject: 'Validez votre commande · Seconde Vie',
        eyebrow: 'Validation de commande',
        title: 'Confirmez votre adresse email.',
        intro: 'Utilisez ce code à six chiffres pour poursuivre votre commande en toute sécurité.',
        purpose: 'Code de validation'
    }
});

function renderOtpEmail({ variant, code, siteUrl }) {
    const copy = OTP_VARIANTS[variant];
    if (!copy || !/^\d{6}$/.test(String(code || ''))) {
        const error = new Error('OTP_EMAIL_TEMPLATE_INVALID');
        error.code = 'OTP_EMAIL_TEMPLATE_INVALID';
        throw error;
    }
    const safeCode = escapeHtml(code);
    const contentHtml = `
        <div style="padding:22px 20px;text-align:center;background:${EMAIL_COLORS.surfaceMuted};border:1px solid ${EMAIL_COLORS.line};border-radius:14px;">
            <div style="color:${EMAIL_COLORS.muted};font:700 10px/1.4 Arial,Helvetica,sans-serif;letter-spacing:1.3px;text-transform:uppercase;">
                ${escapeHtml(copy.purpose)}
            </div>
            <div style="margin-top:10px;color:${EMAIL_COLORS.text};font:700 38px/1 Arial,Helvetica,sans-serif;letter-spacing:9px;">
                ${safeCode}
            </div>
            <div style="margin-top:10px;color:${EMAIL_COLORS.muted};font:400 12px/1.5 Arial,Helvetica,sans-serif;">
                Expire dans 10 minutes · Usage unique
            </div>
        </div>
    `;
    const calloutHtml = renderCallout({
        role: 'warning',
        title: 'Vous n’êtes pas à l’origine de cette demande ?',
        body: 'Ignorez simplement cet email. Ne partagez jamais ce code avec une autre personne.'
    });
    return {
        subject: copy.subject,
        text: [
            copy.purpose,
            '',
            `Code : ${code}`,
            '',
            'Ce code expire dans 10 minutes et ne peut être utilisé qu’une seule fois.',
            'Si vous n’êtes pas à l’origine de cette demande, ignorez cet email.',
            '',
            siteUrl
        ].join('\n'),
        html: renderEmailShell({
            preheader: `${copy.purpose} : ${code}. Expiration dans 10 minutes.`,
            eyebrow: copy.eyebrow,
            title: copy.title,
            intro: copy.intro,
            contentHtml,
            calloutHtml,
            actionLabel: 'Retourner sur Seconde Vie',
            actionUrl: siteUrl,
            footer: 'Code personnel et temporaire. Seconde Vie ne vous demandera jamais de le communiquer.'
        })
    };
}

module.exports = {
    OTP_VARIANTS,
    renderOtpEmail
};
