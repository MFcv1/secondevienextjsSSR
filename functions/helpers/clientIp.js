'use strict';

const net = require('node:net');

const UNKNOWN_CLIENT_IP = 'unknown';
const MAX_CANDIDATE_LENGTH = 256;

function normalizeClientIp(value) {
    if (Array.isArray(value)) value = value[0];
    if (typeof value !== 'string') return null;

    let candidate = value.trim().replace(/^"|"$/g, '');
    if (!candidate || candidate.length > MAX_CANDIDATE_LENGTH || candidate.toLowerCase() === 'unknown') {
        return null;
    }

    const bracketedIpv6 = candidate.match(/^\[([^\]]+)\](?::\d{1,5})?$/);
    if (bracketedIpv6) candidate = bracketedIpv6[1];

    const ipv4WithPort = candidate.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?::\d{1,5})$/);
    if (ipv4WithPort) candidate = ipv4WithPort[1];

    if (candidate.toLowerCase().startsWith('::ffff:')) {
        const mappedIpv4 = candidate.slice('::ffff:'.length);
        if (net.isIP(mappedIpv4) === 4) return mappedIpv4;
    }

    const version = net.isIP(candidate);
    if (version === 4) return candidate;
    if (version !== 6) return null;

    try {
        const hostname = new URL(`http://[${candidate}]/`).hostname;
        return hostname.slice(1, -1).toLowerCase();
    } catch {
        return null;
    }
}

function firstForwardedIp(value) {
    const values = Array.isArray(value) ? value : [value];
    for (const entry of values) {
        if (typeof entry !== 'string' || entry.length > 2048) continue;
        for (const part of entry.split(',').slice(0, 10)) {
            const normalized = normalizeClientIp(part);
            if (normalized) return normalized;
        }
    }
    return null;
}

function getRateLimitClientIp(context = {}) {
    const request = context.rawRequest || context;
    const headers = request?.headers || {};
    const directCandidates = [
        request?.ip,
        headers['x-appengine-user-ip'],
        request?.socket?.remoteAddress,
        request?.connection?.remoteAddress
    ];

    for (const candidate of directCandidates) {
        const normalized = normalizeClientIp(candidate);
        if (normalized) return normalized;
    }

    return firstForwardedIp(headers['x-forwarded-for']) || UNKNOWN_CLIENT_IP;
}

module.exports = {
    UNKNOWN_CLIENT_IP,
    normalizeClientIp,
    getRateLimitClientIp
};
