'use client';

import { AuthProvider } from '../contexts/AuthContext';
import AnalyticsProvider from './AnalyticsProvider';

export default function AnalyticsRuntimeIsland({ trackedPage }) {
  if (!trackedPage) return null;

  return (
    <AuthProvider forceInitialize ensureAnonymous deferUntilReady={false}>
      <AnalyticsProvider view={trackedPage.view} selectedItemId={trackedPage.itemId} />
    </AuthProvider>
  );
}
