const test = require('node:test');
const assert = require('node:assert/strict');
const { createGeoLookup, unknownGeo } = require('../functions/src/analytics/geo');

test('lookup uses HTTPS and only persists geographic labels, including IPv6', async () => {
    const lookup = createGeoLookup({ fetchImpl: async (url, options) => {
        assert.equal(new URL(url).origin, 'https://ipwho.is');
        assert.equal(decodeURIComponent(new URL(url).pathname), '/2606:4700:4700::1111');
        assert.equal(options.redirect, 'error');
        return { ok: true, json: async () => ({ success: true, city: 'Caen', region: 'Normandie', country: 'France', ip: 'private', latitude: 49 }) };
    } });
    assert.deepEqual(await lookup({ ip: '2606:4700:4700::1111' }), { city: 'Caen', region: 'Normandie', country: 'France' });
});

test('missing, private and invalid IPs never call provider or trust arbitrary headers', async () => {
    const lookup = createGeoLookup({ fetchImpl: async () => { assert.fail('unexpected network'); } });
    for (const ip of [undefined, '127.0.0.2', '10.0.0.1', '172.31.1.1', '192.168.0.1', '100.64.1.1', '::1', 'fe80::1', '::ffff:127.0.0.1', 'not-an-ip']) {
        assert.deepEqual(await lookup({ ip, headers: { 'cf-connecting-ip': '8.8.8.8' } }), unknownGeo());
    }
});

test('rate limit suppresses further calls until Retry-After expires', async () => {
    let time = 0, calls = 0;
    const lookup = createGeoLookup({ now: () => time, fetchImpl: async () => {
        calls++;
        return { status: 429, headers: new Headers({ 'retry-after': '120' }) };
    } });
    assert.deepEqual(await lookup({ ip: '8.8.8.8' }), unknownGeo());
    await lookup({ ip: '1.1.1.1' });
    assert.equal(calls, 1);
    time = 120001;
    await lookup({ ip: '1.1.1.1' });
    assert.equal(calls, 2);
});

test('timeouts, malformed responses and provider failures are non-blocking', async () => {
    const timeout = createGeoLookup({ timeoutMs: 5, fetchImpl: (_, { signal }) => new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('private IP in provider error')));
    }) });
    assert.deepEqual(await timeout({ ip: '8.8.8.8' }), unknownGeo());
    for (const response of [{ ok: false }, { ok: true, json: async () => { throw new Error('JSON'); } }, { ok: true, json: async () => ({ success: false }) }]) {
        const lookup = createGeoLookup({ fetchImpl: async () => response });
        assert.deepEqual(await lookup({ ip: '8.8.8.8' }), unknownGeo());
    }
});
