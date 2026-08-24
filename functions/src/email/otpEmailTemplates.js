'use strict';

const {
    EMAIL_COLORS,
    EMAIL_FONT_STACK,
    escapeHtml,
    renderCallout,
    renderEmailShell
} = require('./emailDesignSystem');

const OTP_VARIANTS = Object.freeze({
    login: {
        subject: 'Votre code de connexion · Seconde Vie',
        eyebrow: 'Connexion sécurisée',
        title: 'Votre code de connexion',
        intro: 'Utilisez ce code à six chiffres pour vous connecter à votre espace client.',
        purpose: 'Code de connexion'
    },
    checkout: {
        subject: 'Validez votre commande · Seconde Vie',
        eyebrow: 'Validation de commande',
        title: 'Votre code de validation',
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
        <div style="padding:22px 0;border-top:1px solid ${EMAIL_COLORS.line};border-bottom:1px solid ${EMAIL_COLORS.line};">
            <div style="color:${EMAIL_COLORS.muted};font-family:${EMAIL_FONT_STACK};font-size:13px;line-height:1.4;font-weight:400;">
                ${escapeHtml(copy.purpose)}
            </div>
            <div style="margin-top:8px;color:${EMAIL_COLORS.text};font-family:${EMAIL_FONT_STACK};font-size:30px;line-height:1.15;font-weight:600;letter-spacing:5px;">
                ${safeCode}
            </div>
            <div style="margin-top:10px;color:${EMAIL_COLORS.muted};font-family:${EMAIL_FONT_STACK};font-size:13px;line-height:1.5;font-weight:400;">
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
            footer: 'Code personnel et temporaire. Seconde Vie ne vous demandera jamais de le communiquer.',
            titleAlign: 'left'
        })
    };
}

module.exports = {
    OTP_VARIANTS,
    renderOtpEmail
};
