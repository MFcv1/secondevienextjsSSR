'use strict';

const { isIP } = require('node:net');
const { normalizeClientIp } = require('../../helpers/clientIp');
const unknownGeo = () => ({ country: 'Unknown', region: 'Unknown', city: 'Unknown' });

function publicIp(value) {
    const ip = normalizeClientIp(value);
    if (!ip) return null;
    if (isIP(ip) === 4) {
        const [a, b] = ip.split('.').map(Number);
        if (a === 0 || a === 10 || a === 127 || a >= 224 ||
            (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
            (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) return null;
    } else if (!/^[23]/.test(ip) || ip.startsWith('2001:db8:')) return null;
    return ip;
}

function sanitizeGeo(value) {
    const result = unknownGeo();
    for (const field of Object.keys(result)) {
        const text = typeof value?.[field] === 'string' ? value[field].trim() : '';
        if (text && text.length <= 100 && /^[\p{L}\p{M}\p{N} .,'’()-]+$/u.test(text)) result[field] = text;
    }
    return result;
}

function createGeoLookup({ fetchImpl = globalThis.fetch, now = Date.now, timeoutMs = 1200 } = {}) {
    let retryAt = 0;
    return async function lookup(request) {
        // Use the framework's resolved client IP, never a browser payload or arbitrary CDN header.
        const ip = publicIp(request?.ip);
        if (!ip || now() < retryAt) return unknownGeo();
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetchImpl(`https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country,region,city&lang=fr`, {
                signal: controller.signal, redirect: 'error', headers: { Accept: 'application/json' }
            });
            if (response.status === 429) {
                const seconds = Number(response.headers.get('retry-after'));
                retryAt = now() + (Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, 86400) : 86400) * 1000;
                return unknownGeo();
            }
            if (!response.ok) throw new Error('GEO_UNAVAILABLE');
            const data = await response.json();
            if (data?.success !== true) throw new Error('GEO_UNAVAILABLE');
            return sanitizeGeo(data);
        } catch {
            // Never log the provider URL/error: it can contain the visitor IP.
            retryAt = now() + 60_000;
            return unknownGeo();
        } finally {
            clearTimeout(timer);
        }
    };
}

module.exports = { createGeoLookup, sanitizeGeo, publicIp, unknownGeo };
