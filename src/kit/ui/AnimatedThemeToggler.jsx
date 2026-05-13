import React, { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { flushSync } from 'react-dom';

const THEME_VEIL_COLORS = {
    dark: 'rgba(10, 10, 10, 0.18)',
    light: 'rgba(250, 250, 249, 0.22)',
};

const SETTLE_DURATION = 140;
const MOTION_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * AnimatedThemeToggler
 * Applies the theme in one synchronous pass, then adds a short compositor-only veil.
 */
export function AnimatedThemeToggler({ isDark, toggleTheme }) {
    const buttonRef = useRef(null);

    const handleToggle = () => {
        const root = document.documentElement;
        if (root.classList.contains('theme-transitioning')) return;

        const nextIsDark = !isDark;
        const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const canAnimateVeil = !prefersReducedMotion && typeof document.body?.animate === 'function';

        const syncDocumentTheme = () => {
            root.classList.toggle('dark', nextIsDark);
            try {
                localStorage.setItem('darkMode', String(nextIsDark));
            } catch {
                // Storage can be unavailable in private/restricted contexts.
            }
        };

        const finishTransition = () => {
            root.classList.remove('theme-transitioning');
        };

        root.classList.add('theme-transitioning');

        let veil = null;
        if (canAnimateVeil) {
            veil = document.createElement('div');
            veil.setAttribute('aria-hidden', 'true');
            Object.assign(veil.style, {
                position: 'fixed',
                inset: '0',
                zIndex: '2147483646',
                pointerEvents: 'none',
                background: nextIsDark ? THEME_VEIL_COLORS.dark : THEME_VEIL_COLORS.light,
                opacity: '1',
                willChange: 'opacity',
                contain: 'paint',
            });
            document.body.appendChild(veil);
        }

        flushSync(() => {
            syncDocumentTheme();
            toggleTheme();
        });

        if (!canAnimateVeil || !veil) {
            requestAnimationFrame(finishTransition);
            return;
        }

        buttonRef.current?.animate(
            [
                { transform: 'scale(0.94)' },
                { transform: 'scale(1)' },
            ],
            {
                duration: SETTLE_DURATION,
                easing: MOTION_EASE,
            }
        );

        const cleanupTimer = window.setTimeout(() => {
            veil.remove();
            finishTransition();
        }, SETTLE_DURATION + 48);

        const veilAnimation = veil.animate(
            [
                { opacity: 1 },
                { opacity: 0 },
            ],
            {
                duration: SETTLE_DURATION,
                easing: MOTION_EASE,
                fill: 'forwards',
            }
        );

        const cleanupVeil = () => {
            window.clearTimeout(cleanupTimer);
            veil.remove();
            finishTransition();
        };

        veilAnimation.finished.then(cleanupVeil, cleanupVeil);
    };

    return (
        <button
            ref={buttonRef}
            onClick={handleToggle}
            className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-colors z-[100] bg-transparent 
                ${isDark ? 'text-stone-200 hover:text-amber-400' : 'text-stone-900 hover:text-amber-600'}`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
        >
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                    key={isDark ? 'dark' : 'light'}
                    initial={{ y: -8, opacity: 0, rotate: -22, scale: 0.92 }}
                    animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ y: 8, opacity: 0, rotate: 22, scale: 0.92, transition: { duration: 0.12 } }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    {isDark ? (
                        <Moon className="w-5 h-5" strokeWidth={1.5} />
                    ) : (
                        <Sun className="w-5 h-5" strokeWidth={1.5} />
                    )}
                </motion.div>
            </AnimatePresence>
        </button>
    );
}

export default AnimatedThemeToggler;
