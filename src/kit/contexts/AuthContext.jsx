import React, { createContext, useContext, useEffect } from 'react';
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
import { signInWithCustomTokenResilient } from '../auth/customTokenSignIn';
import {
    beginGoogleAuthAttempt,
    recordGoogleAuthDiagnostic,
} from '../auth/googleAuthDiagnostics';
import {
    hasAuthRedirectPending,
    markAuthRedirectPending,
} from '../auth/redirectState';

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
    forceInitialize || hasAuthRedirectPending() || hasPersistedFirebaseUser() || isAuthRoute()
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
export const AuthProvider = ({ children, forceInitialize = false, deferUntilReady = true, ensureAnonymous = false }) => {
    const authState = useAuthState();
    const { user } = authState;
    const googleRuntimeRef = React.useRef(null);
    const googleRuntimePromiseRef = React.useRef(null);

    // Authentication relies on Firestore Rules & Custom Claims now.
    // No hardcoded emails in client bundle.

    // Public visitors do not need Firebase Auth on the first paint. Keep Auth off
    // until a persisted/redirected session exists or the user opens an auth route.
    useEffect(() => {
        let cancelled = false;
        initializeAuthStore({ forceInitialize: shouldInitializeAuthOnMount(forceInitialize || ensureAnonymous) })
            .then(async () => {
                if (!ensureAnonymous || cancelled) return;
                const auth = await getFirebaseAuth();
                if (typeof auth.authStateReady === 'function') await auth.authStateReady();
                if (auth.currentUser || cancelled) return;
                const authModule = await loadAuthModule();
                const result = await authModule.signInAnonymously(auth);
                if (!cancelled && result?.user) syncAuthStoreUser(result.user);
            })
            .catch((error) => {
                if (!cancelled) {
                    console.error('Auth initialization error:', error);
                }
            });
        return () => { cancelled = true; };
    }, [forceInitialize, ensureAnonymous]);

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

    const preloadGoogleLogin = React.useCallback(({ force = false } = {}) => {
        if (force) {
            googleRuntimeRef.current = null;
            googleRuntimePromiseRef.current = null;
        }
        if (googleRuntimeRef.current) return Promise.resolve(googleRuntimeRef.current);
        if (!googleRuntimePromiseRef.current) {
            const attempt = beginGoogleAuthAttempt();
            googleRuntimePromiseRef.current = Promise.all([
                getFirebaseAuth(),
                loadAuthModule(),
                getGoogleProvider(),
            ]).then(([auth, authModule, provider]) => {
                const runtime = { auth, authModule, provider };
                googleRuntimeRef.current = runtime;
                recordGoogleAuthDiagnostic({ attempt, phase: 'preload', outcome: 'success' });
                return runtime;
            }).catch((error) => {
                googleRuntimePromiseRef.current = null;
                recordGoogleAuthDiagnostic({ attempt, phase: 'preload', outcome: 'error', error });
                throw error;
            });
        }
        return googleRuntimePromiseRef.current;
    }, []);

    const loginWithGoogle = async () => {
        const preparedRuntime = googleRuntimeRef.current;
        if (!preparedRuntime) {
            const error = Object.assign(
                new Error('Google authentication runtime is not prepared.'),
                { code: 'auth/google-not-prepared' }
            );
            const attempt = beginGoogleAuthAttempt();
            recordGoogleAuthDiagnostic({ attempt, phase: 'popup', outcome: 'error', error });
            throw error;
        }

        const { auth, authModule, provider } = preparedRuntime;
        const attempt = beginGoogleAuthAttempt();
        if (isIOSStandalone()) {
            markAuthRedirectPending();
            recordGoogleAuthDiagnostic({ attempt, phase: 'redirect', outcome: 'started' });
            try {
                await authModule.signInWithRedirect(auth, provider);
                return null;
            } catch (error) {
                recordGoogleAuthDiagnostic({ attempt, phase: 'redirect', outcome: 'error', error });
                throw error;
            }
        }

        // When preloaded, signInWithPopup is invoked before the first await so
        // the browser still associates it with the user's click.
        recordGoogleAuthDiagnostic({ attempt, phase: 'popup', outcome: 'started' });
        try {
            const result = await authModule.signInWithPopup(auth, provider);
            recordGoogleAuthDiagnostic({ attempt, phase: 'popup', outcome: 'success' });
            getCallableFunction('updateUserSessions')
                .then((updateUserSessions) => updateUserSessions())
                .catch(err => console.error('Failed to clean sessions after login:', err));
            syncAuthStoreUser(result.user, { lastAuthMethod: 'google' });
            return result;
        } catch (error) {
            recordGoogleAuthDiagnostic({ attempt, phase: 'popup', outcome: 'error', error });
            throw error;
        }
    };

    const loginWithEmail = async (email, password) => {
        const { auth, authModule } = await getAuthRuntime();
        const result = await authModule.signInWithEmailAndPassword(auth, email, password);
        getCallableFunction('updateUserSessions')
            .then((updateUserSessions) => updateUserSessions())
            .catch(err => console.error('Failed to clean sessions after login:', err));
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
        const result = await signInWithCustomTokenResilient({ authModule, auth, token });
        getCallableFunction('updateUserSessions')
            .then((updateUserSessions) => updateUserSessions())
            .catch(err => console.error('Failed to clean sessions after login:', err));
        syncAuthStoreUser(result.user, { lastAuthMethod: method });
        return result;
    };

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const isE2ERun = new URLSearchParams(window.location.search).has('e2e_run');
        const isApprovedSandboxHost = [
            'secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app',
            'localhost',
            '127.0.0.1',
        ].includes(window.location.hostname);
        if (!isE2ERun || !isApprovedSandboxHost) return undefined;

        window.__svE2ELoginWithCustomToken = async ({ token, method = 'sandbox_session' }) => {
            const result = await loginWithCustomToken(token, method);
            return {
                uid: result?.user?.uid || null,
                email: result?.user?.email || null,
                emailVerified: Boolean(result?.user?.emailVerified),
            };
        };

        return () => {
            delete window.__svE2ELoginWithCustomToken;
        };
    }, []);

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
        preloadGoogleLogin,
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
