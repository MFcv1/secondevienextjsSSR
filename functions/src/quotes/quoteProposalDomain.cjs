'use strict';

function normalizeProposal(value) {
    const fail = () => { throw new Error('Proposition invalide : renseignez 1 à 20 prestations, leurs prix et une validité de 1 à 90 jours.'); };
    if (!value || !Array.isArray(value.lines) || !value.lines.length || value.lines.length > 20) fail();
    const lines = value.lines.map((line) => {
        const label = String(line?.label || '').trim();
        const { minCents, maxCents } = line || {};
        if (!label || label.length > 200 || !Number.isSafeInteger(minCents) || !Number.isSafeInteger(maxCents)
            || minCents < 0 || maxCents < minCents || maxCents > 10_000_000) fail();
        return { label, minCents, maxCents };
    });
    const validDays = value.validDays;
    const message = String(value.message || '').trim();
    if (!Number.isInteger(validDays) || validDays < 1 || validDays > 90 || message.length > 4000) fail();
    const minCents = lines.reduce((sum, line) => sum + line.minCents, 0);
    const maxCents = lines.reduce((sum, line) => sum + line.maxCents, 0);
    if (maxCents <= 0 || maxCents > 10_000_000) fail();
    return { lines, validDays, message, minCents, maxCents, currency: 'EUR' };
}

function proposalsEqual(left, right) {
    if (!left || !right) return false;
    return JSON.stringify(normalizeProposal(left)) === JSON.stringify(normalizeProposal(right));
}

module.exports = { normalizeProposal, proposalsEqual };
