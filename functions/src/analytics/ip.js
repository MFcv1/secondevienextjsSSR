const UNKNOWN_IP = 'Unknown';

const IP_HEADERS = [
    'x-forwarded-for',
    'x-appengine-user-ip',
    'fastly-client-ip',
    'cf-connecting-ip',
    'x-real-ip'
];

const normalizeIp = (value) => {
    if (!value || typeof value !== 'string') return null;

    let ip = value.trim().replace(/^"|"$/g, '');
    if (!ip || ip.toLowerCase() === 'unknown') return null;

    const bracketedIpv6 = ip.match(/^\[([^\]]+)\](?::\d+)?$/);
    if (bracketedIpv6) {
        ip = bracketedIpv6[1];
    }

    if (ip.startsWith('::ffff:')) {
        ip = ip.slice('::ffff:'.length);
    }

    const ipv4WithPort = ip.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/);
    if (ipv4WithPort) {
        ip = ipv4WithPort[1];
    }

    return ip || null;
};
const getIpVersion = (ip) => {
    if (!ip || ip === UNKNOWN_IP) return null;
    if (ip.includes(':')) return 6;
    if (ip.includes('.')) return 4;
    return null;
};

const isPrivateOrLocalIp = (ip) => {
    if (!ip || ip === UNKNOWN_IP) return true;
    if (ip === '127.0.0.1' || ip === '::1' || ip === '0.0.0.0') return true;
    if (ip.startsWith('10.') || ip.startsWith('192.168.')) return true;

    const parts = ip.split('.').map(Number);
    if (parts.length === 4 && parts.every(Number.isFinite)) {
        if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
        if (parts[0] === 169 && parts[1] === 254) return true;
    }

    const lowerIp = ip.toLowerCase();
    return lowerIp.startsWith('fc') || lowerIp.startsWith('fd') || lowerIp.startsWith('fe80:');
};

const isUsableIp = (ip) => Boolean(ip && ip !== UNKNOWN_IP);

const addHeaderCandidates = (candidates, source, rawValue) => {
    if (!rawValue) return;
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];

    values.forEach((value) => {
        String(value)
            .split(',')
            .map(part => part.trim())
            .filter(Boolean)
            .forEach((candidate) => {
                const ip = normalizeIp(candidate);
                if (ip) candidates.push({ ip, source });
            });
    });
};

const getClientIpInfo = (req = {}) => {
    const headers = req.headers || {};
    const candidates = [];

    IP_HEADERS.forEach((header) => {
        addHeaderCandidates(candidates, header, headers[header]);
    });

    addHeaderCandidates(candidates, 'remoteAddress', req.connection?.remoteAddress);
    addHeaderCandidates(candidates, 'socket.remoteAddress', req.socket?.remoteAddress);
    addHeaderCandidates(candidates, 'req.ip', req.ip);

    const first = candidates[0];
    if (!first) {
        return {
            ip: UNKNOWN_IP,
            source: 'none',
            version: null,
            detected: false,
            usable: false,
            public: false
        };
    }

    return {
        ip: first.ip,
        source: first.source,
        version: getIpVersion(first.ip),
        detected: true,
        usable: isUsableIp(first.ip),
        public: !isPrivateOrLocalIp(first.ip)
    };
};

module.exports = {
    UNKNOWN_IP,
    normalizeIp,
    getIpVersion,
    isPrivateOrLocalIp,
    isUsableIp,
    getClientIpInfo
};
