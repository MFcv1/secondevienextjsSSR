import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendEmailVerification,
    getIdTokenResult
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

// ⚠️ CONFIGURER dans .env.local : VITE_SUPER_ADMIN_EMAIL=votre@email.com
const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || '';

// Detect iOS standalone PWA mode (added to home screen)
// In this mode, signInWithPopup is blocked by WebKit — must use signInWithRedirect
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

// Create the context
const AuthContext = createContext();

// Hook to use the context
export const useAuth = () => {
    return useContext(AuthContext);
};

// Provider Component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // Authentication relies on Firestore Rules & Custom Claims now.
    // No hardcoded emails in client bundle.

    // 1. Handle redirect result FIRST.
    // On page reload after signInWithRedirect, getRedirectResult resolves with the Google user.
    // The sessionStorage flag preserves the redirect lifecycle across reloads.
    useEffect(() => {
        let cancelled = false;
        const handleRedirect = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result && result.user && !cancelled) {
                    httpsCallable(functions, 'updateUserSessions')()
                        .catch(err => console.error('Failed to clean sessions after redirect login:', err));
                }
            } catch (error) {
                if (!cancelled) {
                    console.error('Redirect auth error:', error);
                }
            } finally {
                // Always clear the flag — redirect is done (success or failure)
                clearRedirectPending();
            }
        };
        handleRedirect();
        return () => { cancelled = true; };
    }, []);

    // 2. Listen to Auth State (Run once)
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribeAuth();
    }, []);

    // 2. Read user role once from claims. Avoid keeping a Firestore listener for every client.
    useEffect(() => {
        if (!user || user.isAnonymous) {
            setIsAdmin(false);
            return;
        }

        let cancelled = false;

        const syncAdminClaim = async () => {
            try {
                const tokenResult = await getIdTokenResult(user, true);
                if (!cancelled) {
                    setIsAdmin(tokenResult.claims.admin === true || user.email === SUPER_ADMIN_EMAIL);
                }
            } catch (err) {
                console.error("Error reading admin claim:", err);
                if (!cancelled) setIsAdmin(user.email === SUPER_ADMIN_EMAIL);
            }
        };

        syncAdminClaim();

        if (user.email === SUPER_ADMIN_EMAIL) {
            setIsAdmin(true);
        }

        return () => {
            cancelled = true;
        };
    }, [user]);

    const loginWithGoogle = async () => {
        if (isIOSStandalone()) {
            // iOS standalone (PWA home screen): signInWithPopup is blocked by WebKit
            // Use signInWithRedirect — page will reload and getRedirectResult handles it above
            // Flag persists in sessionStorage so the redirect lifecycle survives reload.
            setRedirectPending();
            await signInWithRedirect(auth, googleProvider);
            return null; // Page reloads, this line won't execute
        }
        // Normal browser (Safari, Chrome, etc.): signInWithPopup works fine
        const result = await signInWithPopup(auth, googleProvider);
        httpsCallable(functions, 'updateUserSessions')()
            .catch(err => console.error('Failed to clean sessions after login:', err));
        return result;
    };

    const loginWithEmail = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const signupWithEmail = (email, password) => {
        return createUserWithEmailAndPassword(auth, email, password);
    };

    const logout = () => {
        return signOut(auth);
    };

    const verifyEmail = (user) => {
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
            {!loading && children}
        </AuthContext.Provider>
    );
};
