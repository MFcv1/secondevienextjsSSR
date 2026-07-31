'use strict';

const EMAIL_COLORS = Object.freeze({
    canvas: '#f3f0e9',
    surface: '#ffffff',
    surfaceMuted: '#f7f4ee',
    text: '#1c1917',
    muted: '#6f675e',
    line: '#ded7cc',
    action: '#1c1917',
    accent: '#b45309',
    success: '#166534',
    successSurface: '#ecfdf5',
    info: '#3152a3',
    infoSurface: '#eef4ff',
    warning: '#9a5b08',
    warningSurface: '#fffbeb',
    danger: '#b42318',
    dangerSurface: '#fff1f2'
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
    if (role === 'success') {
        return { foreground: EMAIL_COLORS.success, surface: EMAIL_COLORS.successSurface };
    }
    if (role === 'info') {
        return { foreground: EMAIL_COLORS.info, surface: EMAIL_COLORS.infoSurface };
    }
    if (role === 'warning') {
        return { foreground: EMAIL_COLORS.warning, surface: EMAIL_COLORS.warningSurface };
    }
    if (role === 'danger') {
        return { foreground: EMAIL_COLORS.danger, surface: EMAIL_COLORS.dangerSurface };
    }
    return { foreground: EMAIL_COLORS.muted, surface: EMAIL_COLORS.surfaceMuted };
}

function renderSummaryGrid(items) {
    return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
            style="background:${EMAIL_COLORS.surfaceMuted};border:1px solid ${EMAIL_COLORS.line};border-radius:14px;">
            <tr>
                ${items.map((item, index) => `
                    <td width="${Math.floor(100 / items.length)}%" valign="top"
                        style="padding:17px 18px;${index ? `border-left:1px solid ${EMAIL_COLORS.line};` : ''}">
                        <div style="color:${EMAIL_COLORS.muted};font:600 10px/1.4 Arial,Helvetica,sans-serif;letter-spacing:1.2px;text-transform:uppercase;">
                            ${escapeHtml(item.label)}
                        </div>
                        <div style="margin-top:5px;color:${item.color || EMAIL_COLORS.text};font:700 14px/1.35 Arial,Helvetica,sans-serif;">
                            ${escapeHtml(item.value)}
                        </div>
                    </td>
                `).join('')}
            </tr>
        </table>
    `;
}

function renderCallout({ title, body, role = 'neutral', detail = null }) {
    const palette = statusPalette(role);
    return `
        <div style="background:${palette.surface};border:1px solid ${EMAIL_COLORS.line};border-radius:12px;padding:17px 19px;">
            <div style="color:${palette.foreground};font:700 14px/1.4 Arial,Helvetica,sans-serif;">
                ${escapeHtml(title)}
            </div>
            <div style="margin-top:6px;color:#3f3a36;font:400 14px/1.6 Arial,Helvetica,sans-serif;">
                ${escapeHtml(body)}
            </div>
            ${detail ? `
                <div style="margin-top:9px;color:${EMAIL_COLORS.muted};font:400 11px/1.5 Arial,Helvetica,sans-serif;">
                    ${escapeHtml(detail)}
                </div>
            ` : ''}
        </div>
    `;
}

function renderEmailShell({
    preheader,
    eyebrow,
    title,
    intro,
    summaryHtml = '',
    contentHtml = '',
    calloutHtml = '',
    actionLabel = null,
    actionUrl = null,
    footer = 'Message automatique envoyé par Seconde Vie.'
}) {
    return `
        <!doctype html>
        <html lang="fr">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <style>
                @media only screen and (max-width:620px) {
                    .sv-pad { padding-left:20px !important; padding-right:20px !important; }
                    .sv-title { font-size:30px !important; }
                    .sv-summary td { display:block !important; width:auto !important; border-left:0 !important; border-top:1px solid ${EMAIL_COLORS.line} !important; }
                    .sv-summary td:first-child { border-top:0 !important; }
                    .sv-action { display:block !important; text-align:center !important; }
                }
            </style>
        </head>
        <body style="margin:0;background:${EMAIL_COLORS.canvas};color:${EMAIL_COLORS.text};font-family:Arial,Helvetica,sans-serif;">
            <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_COLORS.canvas};">
                <tr>
                    <td align="center" style="padding:28px 12px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                            style="max-width:640px;background:${EMAIL_COLORS.surface};border:1px solid ${EMAIL_COLORS.line};border-radius:20px;overflow:hidden;">
                            <tr>
                                <td class="sv-pad" style="background:${EMAIL_COLORS.text};padding:26px 30px;color:#ffffff;">
                                    <div style="font:500 25px/1 Georgia,'Times New Roman',serif;letter-spacing:-.4px;">
                                        Seconde Vie<span style="color:#e58a3a;">.</span>
                                    </div>
                                    <div style="margin-top:7px;color:#d6d3d1;font:600 10px/1.4 Arial,Helvetica,sans-serif;letter-spacing:1.5px;text-transform:uppercase;">
                                        Mobilier restauré à Marseille
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td class="sv-pad" style="padding:32px 30px 16px;">
                                    <div style="color:${EMAIL_COLORS.accent};font:700 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:1.4px;text-transform:uppercase;">
                                        ${escapeHtml(eyebrow)}
                                    </div>
                                    <h1 class="sv-title" style="margin:9px 0 12px;color:${EMAIL_COLORS.text};font:500 35px/1.08 Georgia,'Times New Roman',serif;letter-spacing:-.6px;">
                                        ${escapeHtml(title)}
                                    </h1>
                                    <p style="margin:0;color:#57504a;font:400 16px/1.65 Arial,Helvetica,sans-serif;">
                                        ${escapeHtml(intro)}
                                    </p>
                                </td>
                            </tr>
                            ${summaryHtml ? `
                                <tr><td class="sv-pad sv-summary" style="padding:10px 30px 0;">${summaryHtml}</td></tr>
                            ` : ''}
                            ${contentHtml ? `
                                <tr><td class="sv-pad" style="padding:23px 30px 0;">${contentHtml}</td></tr>
                            ` : ''}
                            ${calloutHtml ? `
                                <tr><td class="sv-pad" style="padding:19px 30px 0;">${calloutHtml}</td></tr>
                            ` : ''}
                            <tr>
                                <td class="sv-pad" style="padding:25px 30px 32px;">
                                    ${actionLabel && actionUrl ? `
                                        <a class="sv-action" href="${escapeHtml(actionUrl)}"
                                            style="display:inline-block;background:${EMAIL_COLORS.action};color:#ffffff;text-decoration:none;border-radius:999px;padding:13px 21px;font:700 14px/1.3 Arial,Helvetica,sans-serif;">
                                            ${escapeHtml(actionLabel)}
                                        </a>
                                    ` : ''}
                                    <p style="margin:${actionLabel && actionUrl ? '22px' : '0'} 0 0;color:${EMAIL_COLORS.muted};font:400 11px/1.6 Arial,Helvetica,sans-serif;">
                                        ${escapeHtml(footer)}
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
    escapeHtml,
    renderCallout,
    renderEmailShell,
    renderSummaryGrid
};
