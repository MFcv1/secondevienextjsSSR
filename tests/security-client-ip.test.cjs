'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  UNKNOWN_CLIENT_IP,
  normalizeClientIp,
  getRateLimitClientIp
} = require('../functions/helpers/clientIp');

test('rate limiting prefers the runtime IP over a forged forwarded header', () => {
  const context = {
    rawRequest: {
      ip: '203.0.113.8',
      headers: { 'x-forwarded-for': '198.51.100.77, 203.0.113.8' },
      socket: { remoteAddress: '10.0.0.2' }
    }
  };
  assert.equal(getRateLimitClientIp(context), '203.0.113.8');
});

test('rate limiting canonicalizes IPv4-mapped and equivalent IPv6 forms', () => {
  assert.equal(normalizeClientIp('::ffff:192.0.2.44'), '192.0.2.44');
  assert.equal(normalizeClientIp('[2001:0db8:0:0:0:0:0:1]:443'), '2001:db8::1');
  assert.equal(normalizeClientIp('2001:db8::1'), '2001:db8::1');
});

test('rate limiting rejects malformed and oversized IP candidates', () => {
  assert.equal(normalizeClientIp('999.1.1.1'), null);
  assert.equal(normalizeClientIp('not-an-ip'), null);
  assert.equal(normalizeClientIp('1'.repeat(257)), null);
});

test('forwarded IP is only a bounded last resort', () => {
  assert.equal(getRateLimitClientIp({
    rawRequest: {
      headers: { 'x-forwarded-for': 'invalid, [2001:0db8::5]:8443, 198.51.100.2' }
    }
  }), '2001:db8::5');
  assert.equal(getRateLimitClientIp({ rawRequest: { headers: {} } }), UNKNOWN_CLIENT_IP);
});
