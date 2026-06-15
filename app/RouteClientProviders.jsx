'use client';

import ErrorBoundary from '../src/kit/shared/ErrorBoundary';
import { AuthProvider } from '../src/kit/contexts/AuthContext';
import { ToastProvider } from '../src/kit/ui/Toast';

export default function RouteClientProviders({ children }) {
  return (
    <AuthProvider forceInitialize deferUntilReady={false}>
      <ErrorBoundary>
        <ToastProvider>{children}</ToastProvider>
      </ErrorBoundary>
    </AuthProvider>
  );
}
