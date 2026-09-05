'use client';

import { getCallableFunction } from '../config/firebaseLazy';
import { invalidateAdminCachedData, invalidateAdminCachedPrefix, loadAdminCachedData } from './adminDataCache';

export const ADMIN_QUOTES_CACHE_KEY = 'admin-quotes:latest';

const call = async (name, payload = {}) => {
  const callable = await getCallableFunction(name);
  const result = await callable(payload);
  return result.data;
};

export const loadQuoteRequestsAdmin = ({ force = false, cursor = null, reference = null } = {}) => (
  loadAdminCachedData(
    cursor || reference ? `${ADMIN_QUOTES_CACHE_KEY}:${JSON.stringify({ cursor, reference })}` : ADMIN_QUOTES_CACHE_KEY,
    () => call('listQuoteRequestsAdmin', { cursor, reference }),
    { force, maxAgeMs: 30_000 }
  )
);

export const preloadAdminQuotesData = ({ force = false } = {}) => (
  loadQuoteRequestsAdmin({ force })
);

export const getQuoteRequestAdmin = (quoteId, version, { force = false } = {}) => loadAdminCachedData(
  `admin-quote:${quoteId}:${version}`,
  () => call('getQuoteRequestAdmin', { quoteId }),
  { force, maxAgeMs: 30_000 }
);

export const updateQuoteRequestAdmin = async (payload) => {
  const result = await call('updateQuoteRequestAdmin', payload);
  invalidateAdminCachedPrefix(ADMIN_QUOTES_CACHE_KEY);
  invalidateAdminCachedData(`admin-quote:${payload.quoteId}:${payload.expectedVersion}`);
  return result;
};
