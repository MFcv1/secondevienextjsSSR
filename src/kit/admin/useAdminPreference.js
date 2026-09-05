'use client';

import { useState } from 'react';
import { getAdminPreference, setAdminPreference } from './adminDataCache';

// The authorized shell remounts its views when the cache generation changes.
// Preferences have the same owner and lifetime, but no data-cache TTL.
export function useAdminPreference(key, fallback) {
  const [value, setValue] = useState(() => getAdminPreference(key, fallback));
  return [value, next => {
    setAdminPreference(key, next);
    setValue(next);
  }];
}
