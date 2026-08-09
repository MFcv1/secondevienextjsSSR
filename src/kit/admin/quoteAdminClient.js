'use client';

import { getCallableFunction } from '../config/firebaseLazy';
import { invalidateAdminCachedData, loadAdminCachedData } from './adminDataCache';

export const ADMIN_QUOTES_CACHE_KEY = 'admin-quotes:latest';

const call = async (name, payload = {}) => {
  const callable = await getCallableFunction(name);
  const result = await callable(payload);
  return result.data;
};

export const loadQuoteRequestsAdmin = ({ force = false } = {}) => (
  loadAdminCachedData(
    ADMIN_QUOTES_CACHE_KEY,
    () => call('listQuoteRequestsAdmin'),
    { force, maxAgeMs: 30_000 }
  )
);

export const preloadAdminQuotesData = ({ force = false } = {}) => (
  loadQuoteRequestsAdmin({ force })
);

export const getQuoteRequestAdmin = (quoteId) => call('getQuoteRequestAdmin', { quoteId });

export const updateQuoteRequestAdmin = async (payload) => {
  const result = await call('updateQuoteRequestAdmin', payload);
  invalidateAdminCachedData(ADMIN_QUOTES_CACHE_KEY);
  return result;
};
