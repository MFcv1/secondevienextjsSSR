import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCallableFunction, getFirebaseAuth, getGoogleProvider, loadAuthModule } from '../config/firebaseLazy';

// CONFIGURER dans .env.local : VITE_SUPER_ADMIN_EMAIL=votre@email.com
const SUPER_ADMIN_EMAIL = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || '').trim().toLowerCase();

const isSuperAdminEmail = (email) => (
    Boolean(SUPER_ADMIN_EMAIL) && email?.toLowerCase() === SUPER_ADMIN_EMAIL
);

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
const REDIRECT_KEY = 'kit_google_redirect_pending';
const setRedirectPending = () => sessionStorage.setItem(REDIRECT_KEY, 'true');
const clearRedirectPending = () => sessionStorage.removeItem(REDIRECT_KEY);

const hasRedirectPending = () => (
    typeof window !== 'undefined' &&
    window.sessionStorage.getItem(REDIRECT_KEY) === 'true'
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

const emitAuthUserChanged = (user) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('sv:auth-user-changed', { detail: { user: user || null } }));
};

// Create the context
const AuthContext = createContext();

// Hook to use the context
export const useAuth = () => {
    return useContext(AuthContext);
};

// Provider Component
export const AuthProvider = ({ children, forceInitialize = false, deferUntilReady = true }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(() => shouldInitializeAuthOnMount(forceInitialize));
    const [isAdmin, setIsAdmin] = useState(false);

    // Authentication relies on Firestore Rules & Custom Claims now.
    // No hardcoded emails in client bundle.

    // Public visitors do not need Firebase Auth on the first paint. Keep Auth off
    // until a persisted/redirected session exists or the user opens an auth route.
    useEffect(() => {
        if (!shouldInitializeAuthOnMount(forceInitialize)) {
            setLoading(false);
            return undefined;
        }

        let cancelled = false;
        let unsubscribeAuth = null;

        const startAuth = async () => {
            const auth = await getFirebaseAuth();
            const { getRedirectResult, onAuthStateChanged } = await loadAuthModule();

            if (hasRedirectPending()) {
                try {
                    const result = await getRedirectResult(auth);
                    if (result && result.user && !cancelled) {
                        getCallableFunction('updateUserSessions')
                            .then((updateUserSessions) => updateUserSessions())
                            .catch(err => console.error('Failed to clean sessions after redirect login:', err));
                    }
                } catch (error) {
                    if (!cancelled) {
                        console.error('Redirect auth error:', error);
                    }
                } finally {
                    clearRedirectPending();
                }
            }

            unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
                if (cancelled) return;
                setUser(currentUser);
                emitAuthUserChanged(currentUser);
                setLoading(false);
            });
        };

        startAuth().catch((error) => {
            if (!cancelled) {
                console.error('Auth initialization error:', error);
                setLoading(false);
            }
        });

        return () => {
            cancelled = true;
            unsubscribeAuth?.();
        };
    }, [forceInitialize]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const handleExternalAuthChange = (event) => {
            setUser(event.detail?.user || null);
            setLoading(false);
        };

        window.addEventListener('sv:auth-user-changed', handleExternalAuthChange);
        return () => window.removeEventListener('sv:auth-user-changed', handleExternalAuthChange);
    }, []);

    const syncSignedInUser = async (result) => {
        if (result?.user) {
            setUser(result.user);
            emitAuthUserChanged(result.user);
            setLoading(false);
        }
        return result;
    };

    const getAuthRuntime = async () => {
        const auth = await getFirebaseAuth();
        const module = await loadAuthModule();
        return { auth, module };
    };

    // 2. Read user role once from claims. Avoid keeping a Firestore listener for every client.
    useEffect(() => {
        if (!user || user.isAnonymous) {
            setIsAdmin(false);
            return;
        }

        let cancelled = false;

        const syncAdminClaim = async () => {
            try {
                const { getIdTokenResult } = await loadAuthModule();
                const tokenResult = await getIdTokenResult(user, true);
                if (!cancelled) {
                    setIsAdmin(tokenResult.claims.admin === true || isSuperAdminEmail(user.email));
                }
            } catch (err) {
                console.error("Error reading admin claim:", err);
                if (!cancelled) setIsAdmin(isSuperAdminEmail(user.email));
            }
        };

        syncAdminClaim();

        if (isSuperAdminEmail(user.email)) {
            setIsAdmin(true);
        }

        return () => {
            cancelled = true;
        };
    }, [user]);

    const loginWithGoogle = async () => {
        const { auth, module } = await getAuthRuntime();
        const googleProvider = await getGoogleProvider();

        if (isIOSStandalone()) {
            // iOS standalone (PWA home screen): signInWithPopup is blocked by WebKit
            // Use signInWithRedirect: page will reload and getRedirectResult handles it above
            // Flag persists in sessionStorage so the redirect lifecycle survives reload.
            setRedirectPending();
            await module.signInWithRedirect(auth, googleProvider);
            return null; // Page reloads, this line won't execute
        }
        // Normal browser (Safari, Chrome, etc.): signInWithPopup works fine
        const result = await module.signInWithPopup(auth, googleProvider);
        getCallableFunction('updateUserSessions')
            .then((updateUserSessions) => updateUserSessions())
            .catch(err => console.error('Failed to clean sessions after login:', err));
        return syncSignedInUser(result);
    };

    const loginWithEmail = async (email, password) => {
        const { auth, module } = await getAuthRuntime();
        const result = await module.signInWithEmailAndPassword(auth, email, password);
        return syncSignedInUser(result);
    };

    const signupWithEmail = async (email, password) => {
        const { auth, module } = await getAuthRuntime();
        const result = await module.createUserWithEmailAndPassword(auth, email, password);
        return syncSignedInUser(result);
    };

    const logout = async () => {
        const { auth, module } = await getAuthRuntime();
        setUser(null);
        setIsAdmin(false);
        emitAuthUserChanged(null);
        return module.signOut(auth);
    };

    const verifyEmail = async (user) => {
        const { sendEmailVerification } = await loadAuthModule();
        return sendEmailVerification(user, {
            url: window.location.origin + '/',
            handleCodeInApp: true
        });
    };

    const value = {
        user,
        isAdmin,
        loading,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logout,
        verifyEmail
    };

    return (
        <AuthContext.Provider value={value}>
            {(!loading || !deferUntilReady) && children}
        </AuthContext.Provider>
    );
};
