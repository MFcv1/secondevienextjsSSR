'use strict';

const net = require('node:net');
const http = require('node:http');
const https = require('node:https');

function hostnameFromRequest(input, options) {
  if (typeof input === 'string' || input instanceof URL) {
    return new URL(input).hostname;
  }
  return options?.hostname || options?.host || input?.hostname || input?.host || '';
}

function isLocalHost(hostname) {
  const normalized = String(hostname || '').replace(/^\[|\]$/g, '').split(':')[0].toLowerCase();
  return normalized === '127.0.0.1' || normalized === 'localhost' || normalized === '::1';
}

function installNetworkGuard({ allowLocalEmulator = false } = {}) {
  const assertAllowed = (hostname) => {
    if (allowLocalEmulator && isLocalHost(hostname)) return;
    throw new Error(`Hosted network access is forbidden in commerce tests (${hostname || 'unknown host'})`);
  };

  for (const transport of [http, https]) {
    const originalRequest = transport.request;
    const originalGet = transport.get;
    transport.request = function guardedRequest(input, options, callback) {
      assertAllowed(hostnameFromRequest(input, options));
      return originalRequest.call(this, input, options, callback);
    };
    transport.get = function guardedGet(input, options, callback) {
      assertAllowed(hostnameFromRequest(input, options));
      return originalGet.call(this, input, options, callback);
    };
  }

  for (const method of ['connect', 'createConnection']) {
    const original = net[method];
    net[method] = function guardedConnection(...args) {
      const options = typeof args[0] === 'object'
        ? args[0]
        : { port: args[0], host: typeof args[1] === 'string' ? args[1] : 'localhost' };
      assertAllowed(options.host || 'localhost');
      return original.apply(this, args);
    };
  }

  const originalFetch = global.fetch;
  global.fetch = async function guardedFetch(input, options) {
    const hostname = new URL(typeof input === 'string' || input instanceof URL ? input : input.url).hostname;
    assertAllowed(hostname);
    return originalFetch(input, options);
  };
}

module.exports = { installNetworkGuard, isLocalHost };
