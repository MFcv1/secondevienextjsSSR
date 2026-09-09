'use client';

import { useSyncExternalStore } from 'react';
import { getConsentSnapshot, parseConsent, subscribeConsent } from './cookieConsent';

const serverSnapshot = () => '';

export default function useCookieConsent() {
  return parseConsent(useSyncExternalStore(subscribeConsent, getConsentSnapshot, serverSnapshot));
}
