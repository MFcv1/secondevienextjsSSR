'use strict';

const EMAIL_FONT_STACK = "-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif";

const EMAIL_COLORS = Object.freeze({
    canvas: '#ffffff',
    surface: '#ffffff',
    surfaceMuted: '#f7f7f8',
    surfaceElevated: '#ffffff',
    text: '#202123',
    muted: '#6b6b70',
    line: '#e5e5e5',
    action: '#0f8f73',
    accent: '#0f8f73',
    success: '#0f8f73',
    successSurface: '#ffffff',
    info: '#3f6473',
    infoSurface: '#ffffff',
    warning: '#8a5a00',
    warningSurface: '#ffffff',
    danger: '#b42318',
    dangerSurface: '#ffffff'
});

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function statusPalette(role = 'neutral') {
    if (role === 'success') return { foreground: EMAIL_COLORS.success };
    if (role === 'info') return { foreground: EMAIL_COLORS.info };
    if (role === 'warning') return { foreground: EMAIL_COLORS.warning };
    if (role === 'danger') return { foreground: EMAIL_COLORS.danger };
    return { foreground: EMAIL_COLORS.text };
}

function renderSummaryGrid(items) {
    if (!Array.isArray(items) || items.length === 0) return '';
    return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
            style="border-top:1px solid ${EMAIL_COLORS.line};">
            ${items.map((item) => `
                <tr>
                    <td valign="top" style="padding:12px 0;border-bottom:1px solid ${EMAIL_COLORS.line};color:${EMAIL_COLORS.text};font-family:${EMAIL_FONT_STACK};font-size:14px;line-height:1.45;font-weight:600;">
                        ${escapeHtml(item.label)}
                    </td>
                    <td valign="top" align="right" style="padding:12px 0 12px 24px;border-bottom:1px solid ${EMAIL_COLORS.line};color:${item.color || EMAIL_COLORS.text};font-family:${EMAIL_FONT_STACK};font-size:14px;line-height:1.45;font-weight:400;">
                        ${escapeHtml(item.value)}
                    </td>
                </tr>
            `).join('')}
        </table>
    `;
}

function renderCallout({ title, body, role = 'neutral', detail = null }) {
    const palette = statusPalette(role);
    return `
        <div style="font-family:${EMAIL_FONT_STACK};">
            <div style="color:${palette.foreground};font-size:15px;line-height:1.45;font-weight:600;">
                ${escapeHtml(title)}
            </div>
            <div style="margin-top:7px;color:${EMAIL_COLORS.text};font-size:15px;line-height:1.6;font-weight:400;">
                ${escapeHtml(body)}
            </div>
            ${detail ? `
                <div style="margin-top:9px;color:${EMAIL_COLORS.muted};font-size:13px;line-height:1.5;font-weight:400;">
                    ${escapeHtml(detail)}
                </div>
            ` : ''}
        </div>
    `;
}

function renderEmailShell({
    preheader,
    title,
    intro,
    summaryHtml = '',
    contentHtml = '',
    calloutHtml = '',
    actionLabel = null,
    actionUrl = null,
    footer = 'Message automatique envoyé par Seconde Vie.',
    titleAlign = 'center'
}) {
    const safeTitleAlign = titleAlign === 'left' ? 'left' : 'center';
    return `
        <!doctype html>
        <html lang="fr">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <meta name="color-scheme" content="light">
            <meta name="supported-color-schemes" content="light">
            <style>
                html, body { margin:0 !important; padding:0 !important; width:100% !important; }
                a { text-decoration:none; }
                @media only screen and (max-width:620px) {
                    .sv-frame { padding:34px 20px !important; }
                    .sv-brand { font-size:34px !important; letter-spacing:-1.4px !important; }
                    .sv-title { font-size:28px !important; line-height:1.18 !important; letter-spacing:-.55px !important; }
                    .sv-intro { font-size:15px !important; }
                    .sv-action { display:block !important; text-align:center !important; }
                }
            </style>
        </head>
        <body style="margin:0;background:${EMAIL_COLORS.canvas};color:${EMAIL_COLORS.text};font-family:${EMAIL_FONT_STACK};-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;">
            <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_COLORS.canvas};">
                <tr>
                    <td class="sv-frame" align="center" style="padding:58px 24px 52px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
                            <tr>
                                <td align="left" style="padding:0 0 58px;">
                                    <div class="sv-brand" style="color:#000000;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:40px;line-height:1.05;font-weight:700;letter-spacing:-1.7px;text-align:left;">
                                        Seconde Vie
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td align="${safeTitleAlign}" style="padding:0;">
                                    <h1 class="sv-title" style="margin:0;color:${EMAIL_COLORS.text};font-family:${EMAIL_FONT_STACK};font-size:32px;line-height:1.2;font-weight:500;letter-spacing:-.75px;text-align:${safeTitleAlign};">
                                        ${escapeHtml(title)}
                                    </h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:30px 0 0;">
                                    <p class="sv-intro" style="margin:0;color:${EMAIL_COLORS.text};font-family:${EMAIL_FONT_STACK};font-size:16px;line-height:1.65;font-weight:400;">
                                        ${escapeHtml(intro)}
                                    </p>
                                </td>
                            </tr>
                            ${summaryHtml ? `
                                <tr><td style="padding:30px 0 0;">${summaryHtml}</td></tr>
                            ` : ''}
                            ${contentHtml ? `
                                <tr><td style="padding:30px 0 0;">${contentHtml}</td></tr>
                            ` : ''}
                            ${calloutHtml ? `
                                <tr><td style="padding:30px 0 0;">${calloutHtml}</td></tr>
                            ` : ''}
                            ${actionLabel && actionUrl ? `
                                <tr>
                                    <td align="center" style="padding:34px 0 0;">
                                        <a class="sv-action" href="${escapeHtml(actionUrl)}"
                                            style="display:inline-block;background:${EMAIL_COLORS.action};color:#ffffff;text-decoration:none;border-radius:4px;padding:13px 20px;font-family:${EMAIL_FONT_STACK};font-size:15px;line-height:1.35;font-weight:600;">
                                            ${escapeHtml(actionLabel)}
                                        </a>
                                    </td>
                                </tr>
                            ` : ''}
                            <tr>
                                <td style="padding:52px 0 0;">
                                    <p style="margin:0;color:${EMAIL_COLORS.muted};font-family:${EMAIL_FONT_STACK};font-size:12px;line-height:1.6;font-weight:400;">
                                        ${escapeHtml(footer)}
                                    </p>
                                    <p style="margin:8px 0 0;color:#9a9a9f;font-family:${EMAIL_FONT_STACK};font-size:12px;line-height:1.5;font-weight:400;">
                                        Seconde Vie · Marseille, France
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;
}

module.exports = {
    EMAIL_COLORS,
    EMAIL_FONT_STACK,
    escapeHtml,
    renderCallout,
    renderEmailShell,
    renderSummaryGrid
};
