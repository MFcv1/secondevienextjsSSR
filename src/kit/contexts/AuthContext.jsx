import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCallableFunction, getFirebaseAuth, getGoogleProvider, loadAuthModule } from '../config/firebaseLazy';

import { useSyncExternalStore } from 'react';
import {
    getAuthServerSnapshot,
    getAuthSnapshot,
    initializeAuthStore,
    resetAuthStoreAfterSignOut,
    subscribeAuthStore,
    syncAuthStoreUser,
} from '../auth/authStore';

// Detect iOS standalone PWA mode (added to home screen)
// In this mode, signInWithPopup is blocked by WebKit: must use signInWithRedirect
const isIOSStandalone = () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || typeof document === 'undefined') {
        return false;
    }
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    return isIOS && isStandalone;
};

// Persist redirect flag across page reloads (useRef resets on reload, sessionStorage doesn't)
const REDIRECT_KEY = 'kit_auth_redirect_pending';
const LEGACY_GOOGLE_REDIRECT_KEY = 'kit_google_redirect_pending';
const setRedirectPending = () => sessionStorage.setItem(REDIRECT_KEY, 'true');
const hasRedirectPending = () => (
    typeof window !== 'undefined' &&
    (window.sessionStorage.getItem(REDIRECT_KEY) === 'true' || window.sessionStorage.getItem(LEGACY_GOOGLE_REDIRECT_KEY) === 'true')
);

const hasPersistedFirebaseUser = () => {
    if (typeof window === 'undefined') return false;
    try {
        return Object.keys(window.localStorage).some((key) => (
            key.startsWith('firebase:authUser:')
        ));
    } catch {
        return false;
    }
};

const isAuthRoute = () => {
    if (typeof window === 'undefined') return false;
    return ['/admin', '/checkout', '/wishlist', '/mes-commandes'].some((path) => (
        window.location.pathname.startsWith(path)
    ));
};

const shouldInitializeAuthOnMount = (forceInitialize = false) => (
    forceInitialize || hasRedirectPending() || hasPersistedFirebaseUser() || isAuthRoute()
);

const getEmailVerificationReturnUrl = () => {
    if (typeof window === 'undefined') return undefined;
    return window.location.href || `${window.location.origin}/`;
};

// Create the context
const AuthContext = createContext();

// Hook to use the context
export const useAuth = () => {
    return useContext(AuthContext);
};

export const useAuthState = () => useSyncExternalStore(
    subscribeAuthStore,
    getAuthSnapshot,
    getAuthServerSnapshot
);

// Provider Component
export const AuthProvider = ({ children, forceInitialize = false, deferUntilReady = true }) => {
    const authState = useAuthState();
    const { user } = authState;

    // Authentication relies on Firestore Rules & Custom Claims now.
    // No hardcoded emails in client bundle.

    // Public visitors do not need Firebase Auth on the first paint. Keep Auth off
    // until a persisted/redirected session exists or the user opens an auth route.
    useEffect(() => {
        let cancelled = false;
        initializeAuthStore({ forceInitialize: shouldInitializeAuthOnMount(forceInitialize) }).catch((error) => {
            if (!cancelled) {
                console.error('Auth initialization error:', error);
            }
        });
        return () => { cancelled = true; };
    }, [forceInitialize]);

    const syncSignedInUser = async (result) => {
        if (result?.user) {
            syncAuthStoreUser(result.user);
        }
        return result;
    };

    const getAuthRuntime = async () => {
        const auth = await getFirebaseAuth();
        const authModule = await loadAuthModule();
        return { auth, authModule };
    };


    const loginWithProvider = async (provider) => {
        const { auth, authModule } = await getAuthRuntime();

        if (isIOSStandalone()) {
            // iOS standalone (PWA home screen): signInWithPopup is blocked by WebKit
            // Use signInWithRedirect: page will reload and getRedirectResult handles it above
            // Flag persists in sessionStorage so the redirect lifecycle survives reload.
            setRedirectPending();
            await authModule.signInWithRedirect(auth, provider);
            return null; // Page reloads, this line won't execute
        }
        // Normal browser (Safari, Chrome, etc.): signInWithPopup works fine
        const result = await authModule.signInWithPopup(auth, provider);
        getCallableFunction('updateUserSessions')
            .then((updateUserSessions) => updateUserSessions())
            .catch(err => console.error('Failed to clean sessions after login:', err));
        syncAuthStoreUser(result.user, { lastAuthMethod: 'google' });
        return result;
    };

    const loginWithGoogle = async () => {
        const googleProvider = await getGoogleProvider();
        return loginWithProvider(googleProvider);
    };

    const loginWithEmail = async (email, password) => {
        const { auth, authModule } = await getAuthRuntime();
        const result = await authModule.signInWithEmailAndPassword(auth, email, password);
        syncAuthStoreUser(result.user, { lastAuthMethod: 'password' });
        return result;
    };

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const isE2ERun = new URLSearchParams(window.location.search).has('e2e_run');
        const isSandboxHost = window.location.hostname.includes('hosted.app') || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (!isE2ERun || !isSandboxHost) return undefined;

        window.__svE2ELoginWithEmail = async ({ email, password }) => {
            const result = await loginWithEmail(email, password);
            return {
                uid: result?.user?.uid || null,
                email: result?.user?.email || null,
                emailVerified: Boolean(result?.user?.emailVerified),
            };
        };

        return () => {
            delete window.__svE2ELoginWithEmail;
        };
    }, []);

    const signupWithEmail = async (email, password) => {
        const { auth, authModule } = await getAuthRuntime();
        const result = await authModule.createUserWithEmailAndPassword(auth, email, password);
        return syncSignedInUser(result);
    };

    const loginWithCustomToken = async (token, method = 'custom_token') => {
        const { auth, authModule } = await getAuthRuntime();
        const result = await authModule.signInWithCustomToken(auth, token);
        syncAuthStoreUser(result.user, { lastAuthMethod: method });
        return result;
    };

    const logout = async () => {
        const { auth, authModule } = await getAuthRuntime();
        await authModule.signOut(auth);
        resetAuthStoreAfterSignOut();
    };

    const verifyEmail = async (user) => {
        const { sendEmailVerification } = await loadAuthModule();
        return sendEmailVerification(user, {
            url: getEmailVerificationReturnUrl(),
            handleCodeInApp: true
        });
    };

    const value = {
        user,
        status: authState.status,
        authReady: authState.authReady,
        claimsStatus: authState.claimsStatus,
        isAdmin: authState.claims.admin,
        isSuperAdmin: authState.claims.superAdmin,
        authAssurance: authState.claims.authAssurance,
        authMethod: authState.claims.authMethod,
        userVerified: authState.claims.userVerified,
        authTime: authState.claims.authTime,
        hasStrongAuth: authState.claims.authAssurance === 'aal2',
        loading: !authState.authReady || authState.claimsStatus === 'loading',
        loginWithGoogle,
        loginWithEmail,
        loginWithCustomToken,
        signupWithEmail,
        logout,
        verifyEmail
    };

    return (
        <AuthContext.Provider value={value}>
            {(authState.authReady || !deferUntilReady) && children}
        </AuthContext.Provider>
    );
};
