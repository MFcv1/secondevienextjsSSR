import { useState, useEffect } from 'react';
import { getDb, loadFirestoreModule } from './firebaseLazy';

const THEME_CACHE_KEY = 'themeSettings';
let themeSettingsCache = null;
let themeSettingsPromise = null;

const readCachedThemeSettings = () => {
    if (themeSettingsCache) return themeSettingsCache;
    try {
        const cached = localStorage.getItem(THEME_CACHE_KEY);
        if (!cached) return null;
        themeSettingsCache = JSON.parse(cached);
        return themeSettingsCache;
    } catch {
        return null;
    }
};

const loadThemeSettings = () => {
    if (themeSettingsCache) return Promise.resolve(themeSettingsCache);
    if (themeSettingsPromise) return themeSettingsPromise;

    themeSettingsPromise = Promise.all([getDb(), loadFirestoreModule()])
        .then(([db, { doc, getDoc }]) => getDoc(doc(db, 'sys_metadata', 'theme_settings')))
        .then((docSnap) => {
            const data = docSnap.exists() ? docSnap.data() : {};
            themeSettingsCache = { ...data, activeDesignId: 'architectural' };
            try {
                localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(themeSettingsCache));
            } catch {
                // Cache optional.
            }
            return themeSettingsCache;
        })
        .catch((error) => {
            themeSettingsPromise = null;
            throw error;
        });

    return themeSettingsPromise;
};

/**
 * useLiveTheme - Simplified Version
 * Forces the 'architectural' design as the primary and only frontend.
 * Still listens to Firestore for 'forcedMode' (Light/Dark/Auto) to respect Admin settings.
 */
export const useLiveTheme = () => {
    const [forcedMode, setForcedMode] = useState(() => {
        const cached = readCachedThemeSettings();
        return cached?.forcedMode || 'light';
    });

    const [isThemeLoading, setIsThemeLoading] = useState(() => !readCachedThemeSettings());
    const activeDesignId = 'architectural'; // HARDCODED DEFAULT

    useEffect(() => {
        let mounted = true;
        let idleId = 0;
        const timeoutId = window.setTimeout(() => {
            const run = () => {
                loadThemeSettings().then((data) => {
                    if (!mounted) return;
                    setForcedMode(data.forcedMode || 'light');
                    setIsThemeLoading(false);
                }).catch((err) => {
                    if (mounted) {
                        console.error("Theme settings load error:", err);
                        setIsThemeLoading(false);
                    }
                });
            };

            if (typeof window.requestIdleCallback === 'function') {
                idleId = window.requestIdleCallback(run, { timeout: 3000 });
                return;
            }

            run();
        }, 45000);

        return () => {
            mounted = false;
            window.clearTimeout(timeoutId);
            if (idleId && typeof window.cancelIdleCallback === 'function') {
                window.cancelIdleCallback(idleId);
            }
        };
    }, []);

    // Palette is handled by architectural internal CSS/Tailwind usually, 
    // but some components might still expect it if they weren't fully migrated.
    // For Architectural, we usually rely on native colors, but let's return a hollow object or legacy support if needed.
    const palette = {};

    return {
        palette,
        isStandardMode: false,
        currentThemeId: 'architectural',
        isThemeLoading,
        forcedMode,
        activeDesignId
    };
};

